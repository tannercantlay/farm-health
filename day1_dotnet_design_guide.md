# Day 1 — ASP.NET Core API Design Guide (.NET 10)

A step-by-step plan for building the **animal health monitoring** backend. The goal isn't just a working API — it's to make deliberate design choices you can *explain* in the interview. Each step calls out the "why" and the talking point it maps to.

**Target:** Controller-based Web API on .NET 10, EF Core (SQLite for zero-setup, or SQL Server if you want parity with their stack), a service layer behind DI, Swagger for testing.

**Budget:** ~3–4 hrs. Don't gold-plate; get the full vertical slice working first, then add polish.

---

## 0. Project skeleton (15 min)

```bash
dotnet new webapi --use-controllers -n FarmHealth.Api
cd FarmHealth.Api
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet tool install --global dotnet-ef   # if not already installed
```

> **.NET 10 note:** the template's `Program.cs` is minimal-hosting style (no `Startup.cs`). `--use-controllers` is required now because Minimal APIs are the template default — you explicitly opt back into controllers, which is what Speria likely uses.

**Target folder layout** — organize by responsibility, not by tech. This itself is a talking point (separation of concerns):

```
FarmHealth.Api/
├── Program.cs              # composition root: DI + middleware pipeline
├── Models/                 # EF entities: Farm, Animal, HealthRecord
├── Dtos/                   # request/response records — never expose entities directly
├── Data/                   # AppDbContext + migrations
├── Services/               # IAnimalService / AnimalService — business logic
└── Controllers/            # thin HTTP layer, no logic
```

---

## 1. Design the domain model (20 min)

The relationship chain `Farm (1) → (∞) Animal (1) → (∞) HealthRecord` is the spine of the whole app. Get it right before writing endpoints.

```csharp
// Models/Farm.cs
public class Farm
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? Location { get; set; }
    public List<Animal> Animals { get; set; } = new();
}

// Models/Animal.cs
public class Animal
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Species { get; set; }
    public int FarmId { get; set; }            // FK
    public Farm Farm { get; set; } = null!;     // nav property
    public List<HealthRecord> HealthRecords { get; set; } = new();
}

// Models/HealthRecord.cs
public class HealthRecord
{
    public int Id { get; set; }
    public DateTime RecordedAt { get; set; }
    public required string Status { get; set; }   // "Healthy", "Sick", "Recovering"
    public string? Notes { get; set; }
    public int AnimalId { get; set; }
    public Animal Animal { get; set; } = null!;
}
```

**Design decisions to be able to defend:**
- `required` + nullable reference types enabled → the compiler enforces which fields must be set. Talking point: null-safety.
- FK + navigation property is the EF Core convention for one-to-many; no Fluent API needed for the simple case.
- `= null!` on nav properties silences the nullable warning because EF populates them — this is the idiomatic pattern.

---

## 2. DbContext & the DI lifetime decision (15 min)

```csharp
// Data/AppDbContext.cs
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Farm> Farms => Set<Farm>();
    public DbSet<Animal> Animals => Set<Animal>();
    public DbSet<HealthRecord> HealthRecords => Set<HealthRecord>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        // Cascade delete: removing a Farm removes its Animals & their records
        b.Entity<Animal>()
            .HasOne(a => a.Farm)
            .WithMany(f => f.Animals)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
```

Register it **scoped** (this is what `AddDbContext` does by default):

```csharp
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlite(builder.Configuration.GetConnectionString("Default")));
```

> **#1 interview talking point:** `DbContext` is scoped = one instance per HTTP request. It's *not* thread-safe and tracks entity changes, so a singleton would leak state across requests and a transient would break the unit-of-work pattern within a single request. Be ready to say this cold.

Then create the DB:
```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

---

## 3. DTOs — don't leak your entities (15 min)

Expose `record` DTOs, not EF entities. Two reasons to cite: (1) avoids over-posting / circular-reference JSON loops from nav properties, (2) decouples your API contract from your DB schema.

```csharp
// Dtos/AnimalDtos.cs
public record AnimalResponse(int Id, string Name, string Species, int FarmId);
public record CreateAnimalRequest(string Name, string Species, int FarmId);
public record UpdateAnimalRequest(string Name, string Species);
```

`record` gives value equality + immutability for free — the right tool for a data-transfer object. (Maps to the records/pattern-matching section of your study guide.)

---

## 4. Service layer behind an interface (40 min)

Keep controllers thin; put logic here. The interface is what makes it DI-friendly and testable.

```csharp
// Services/IAnimalService.cs
public interface IAnimalService
{
    Task<IReadOnlyList<AnimalResponse>> GetAllAsync();
    Task<AnimalResponse?> GetByIdAsync(int id);
    Task<AnimalResponse> CreateAsync(CreateAnimalRequest req);
    Task<bool> UpdateAsync(int id, UpdateAnimalRequest req);
    Task<bool> DeleteAsync(int id);
}
```

```csharp
// Services/AnimalService.cs (excerpt)
public class AnimalService(AppDbContext db) : IAnimalService   // primary constructor
{
    public async Task<IReadOnlyList<AnimalResponse>> GetAllAsync() =>
        await db.Animals
            .AsNoTracking()                          // read-only → skip change tracking
            .Select(a => new AnimalResponse(a.Id, a.Name, a.Species, a.FarmId))
            .ToListAsync();

    public async Task<AnimalResponse> CreateAsync(CreateAnimalRequest req)
    {
        var entity = new Animal { Name = req.Name, Species = req.Species, FarmId = req.FarmId };
        db.Animals.Add(entity);
        await db.SaveChangesAsync();
        return new AnimalResponse(entity.Id, entity.Name, entity.Species, entity.FarmId);
    }
    // ... GetByIdAsync, UpdateAsync, DeleteAsync
}
```

Register it:
```csharp
builder.Services.AddScoped<IAnimalService, AnimalService>();
```

**Talking points packed in here:**
- `AsNoTracking()` on reads — perf win, skips EF's change tracker.
- `.Select(...)` projects to the DTO *in the SQL query* (`IQueryable`), so only the columns you need leave the DB. If you `.ToListAsync()` first then `.Select()`, the projection happens in memory — the `IQueryable` vs `IEnumerable` trap.
- Primary constructor (`AnimalService(AppDbContext db)`) is the modern C# 12+ DI style.

---

## 5. Controllers — the thin HTTP layer (40 min)

```csharp
// Controllers/AnimalsController.cs
[ApiController]
[Route("api/[controller]")]
public class AnimalsController(IAnimalService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AnimalResponse>>> GetAll() =>
        Ok(await service.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AnimalResponse>> GetById(int id) =>
        await service.GetByIdAsync(id) is { } a ? Ok(a) : NotFound();

    [HttpPost]
    public async Task<ActionResult<AnimalResponse>> Create(CreateAnimalRequest req)
    {
        var created = await service.CreateAsync(req);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateAnimalRequest req) =>
        await service.UpdateAsync(id, req) ? NoContent() : NotFound();

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) =>
        await service.DeleteAsync(id) ? NoContent() : NotFound();
}
```

**Design notes to mention:**
- Correct status codes: `201 + Location` via `CreatedAtAction`, `204` for update/delete, `404` when missing. Interviewers notice REST hygiene.
- Route constraint `{id:int}` rejects non-numeric ids before your code runs.
- `is { } a` pattern match = "not null, bind to `a`" — pattern-matching talking point.
- Controller has zero business logic — it just translates HTTP ↔ service calls.

Repeat the pattern for `FarmsController` and a nested `HealthRecordsController` (e.g. `api/animals/{animalId}/healthrecords`). The nested route is a nice design detail to show you understand resource hierarchy.

---

## 6. The middleware pipeline (15 min)

Order matters — be able to recite why. Final `Program.cs` tail:

```csharp
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();          // .NET 10 built-in OpenAPI doc generation
    app.UseSwaggerUI(o => o.SwaggerEndpoint("/openapi/v1.json", "FarmHealth"));
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();
```

> **.NET 10 / 9 change worth knowing:** Microsoft dropped the built-in Swashbuckle dependency. The framework now ships `Microsoft.AspNetCore.OpenApi` (`builder.Services.AddOpenApi()` + `app.MapOpenApi()`) to emit the OpenAPI JSON. For a Swagger *UI* you add the `Swashbuckle.AspNetCore.SwaggerUI` package and point it at `/openapi/v1.json`. If short on time, just hit endpoints with the generated `.http` file or curl.

**Pipeline talking point:** exception handling goes first (it wraps everything downstream), routing before auth (you must know the endpoint before authorizing it), auth before the endpoint executes. Putting `UseAuthorization()` after `MapControllers()` would mean nothing is actually protected.

---

## 7. Seed data & manual test (15 min)

Add a tiny seeder so the API isn't empty:

```csharp
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    if (!db.Farms.Any())
    {
        var farm = new Farm { Name = "Green Acres", Location = "Iowa" };
        farm.Animals.Add(new Animal { Name = "Bessie", Species = "Cattle" });
        db.Farms.Add(farm);
        db.SaveChanges();
    }
}
```

Note the explicit `CreateScope()` — you can't pull a *scoped* `DbContext` directly from the root provider, which circles right back to the lifetime talking point.

Test: `dotnet run`, hit the endpoints, confirm CRUD + the 404/201/204 codes.

---

## 8. Stretch — OpenAI health summary endpoint (if time)

Maps directly to the JD's "OpenAI technologies" line, so worth attempting even partially.

- Add `GET api/animals/{id}/summary`.
- Service pulls the animal's recent `HealthRecord`s, builds a prompt ("Summarize this animal's recent health trend"), calls the Claude or OpenAI API, returns the text.
- **Design points to surface:** inject an `IHttpClientFactory` (don't `new` up `HttpClient` — socket exhaustion talking point); put the API key in user-secrets / `IConfiguration`, never hard-coded; use the **Options pattern** (`IOptions<AiOptions>`) to bind the config section. Even if the call is stubbed, *describing* this design scores points.

```bash
dotnet user-secrets init
dotnet user-secrets set "Ai:ApiKey" "sk-..."
```

---

## End-of-day checklist

- [ ] Three entities with correct one-to-many relationships + a migration applied.
- [ ] `DbContext` scoped; can explain why.
- [ ] Service layer behind an interface, registered via DI.
- [ ] Full CRUD on at least Animals (Farms/HealthRecords if time) with correct status codes.
- [ ] DTOs, not entities, on the wire.
- [ ] Pipeline order you can justify out loud.
- [ ] (Stretch) AI summary endpoint or a clear verbal design for it.

**If you only half-finish:** a clean, well-explained Animals slice beats three half-built controllers. Depth of reasoning > breadth of features.
