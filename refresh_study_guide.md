# Angular / ASP.NET Core / C# Refresh Guide — Speria Prep

A condensed reference covering the architecture and key concepts most likely to come up, plus a 2-day build project to put it all into practice.

---

## Part 1: C# Language Essentials

### LINQ
- Method syntax is what you'll see in real code: `.Where()`, `.Select()`, `.OrderBy()`, `.GroupBy()`, `.Aggregate()`, `.FirstOrDefault()`, `.Any()`, `.Sum()`, `.Count()`.
- **Deferred execution**: a LINQ query isn't run until you enumerate it (foreach, `.ToList()`, etc.).
- **`IEnumerable<T>` vs `IQueryable<T>`** — this is a classic interview point. `IQueryable` (used by EF Core) translates your LINQ into SQL and runs on the database. `IEnumerable` pulls everything into memory first, then filters. Calling `.ToList()` too early can silently move filtering from the DB to memory.

### Async/Await
- `Task` (no return value) vs `Task<T>` (returns a value).
- "Async all the way down" — don't mix sync and async carelessly; avoid `.Result` or `.Wait()` on a Task, which can deadlock in ASP.NET Core contexts.
- `Task.WhenAll(...)` to run independent async operations concurrently.

### Nullable Reference Types
- Enabled via `<Nullable>enable</Nullable>` in the project file. The compiler then warns you when a `string` (non-nullable) might actually be null.
- `string?` = explicitly nullable. `??` = null-coalescing (default value). `?.` = null-conditional access. `!` = null-forgiving operator ("trust me, this isn't null").

### Records & Pattern Matching
- `record` types give you immutability + value-based equality for free — great for DTOs.
  ```csharp
  public record Animal(int Id, string Name, string Species);
  var updated = original with { Name = "New Name" }; // non-destructive mutation
  ```
- Pattern matching with switch expressions:
  ```csharp
  string category = animal switch
  {
      { Species: "Cattle" } => "Livestock",
      { Species: "Chicken" } => "Poultry",
      _ => "Other"
  };
  ```

### Generics & Interfaces
- Generic constraints: `where T : class`, `where T : IEntity`.
- Common pattern: `IRepository<T>` with `Add`, `GetById`, `GetAll`, `Update`, `Delete`.
- Interfaces can have default implementations since C# 8 (less commonly used, but good to recognize).

---

## Part 2: ASP.NET Core Architecture

### The Request Pipeline (Middleware)
Every request flows through an ordered chain of middleware configured in `Program.cs`. **Order matters.**
```csharp
app.UseExceptionHandler();
app.UseHttpsRedirection();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
```
Custom middleware can be a simple delegate (`app.Use(async (context, next) => {...})`) or a full class with an `InvokeAsync` method.

### Dependency Injection & Lifetimes
This is one of the most commonly probed concepts. Three lifetimes, registered in `Program.cs`:
- **Transient** — new instance every time it's requested. Good for lightweight, stateless services.
- **Scoped** — one instance per HTTP request. **EF Core's `DbContext` must be scoped** — this is the classic "why does scoped matter" interview answer.
- **Singleton** — one instance for the whole application lifetime. Good for caches, config objects.
```csharp
builder.Services.AddScoped<IAnimalService, AnimalService>();
builder.Services.AddDbContext<AppDbContext>(opt => opt.UseSqlServer(connStr));
```

### Controllers vs Minimal APIs
- **Controllers** (`[ApiController]`, action methods returning `IActionResult`/`ActionResult<T>`) are still the dominant pattern in enterprise codebases — likely what Speria uses.
- Action results: `Ok()`, `NotFound()`, `BadRequest()`, `CreatedAtAction()`.
- Model binding: `[FromBody]`, `[FromRoute]`, `[FromQuery]`.
- **Minimal APIs** (`app.MapGet("/animals", ...)`) are newer and good to be conversant in, but controllers are the safer focus.

### Configuration
- `appsettings.json` + `appsettings.{Environment}.json`, accessed via `IConfiguration`.
- **Options pattern**: bind a config section to a strongly-typed class via `IOptions<T>` rather than reading raw strings everywhere.

---

## Part 3: Entity Framework Core

### DbContext & Migrations
- `DbContext` subclass with `DbSet<T>` properties for each entity.
- Code-first workflow:
  ```bash
  dotnet ef migrations add InitialCreate
  dotnet ef database update
  ```

### Relationships
- One-to-many via navigation properties + foreign key:
  ```csharp
  public class Farm
  {
      public int Id { get; set; }
      public string Name { get; set; }
      public List<Animal> Animals { get; set; } = new();
  }
  public class Animal
  {
      public int Id { get; set; }
      public string Name { get; set; }
      public int FarmId { get; set; }
      public Farm Farm { get; set; }
  }
  ```
- Configure relationships via Fluent API in `OnModelCreating` for anything beyond conventions.

### Querying
- `.Include()` for eager loading related entities (avoids N+1 queries).
- `.AsNoTracking()` for read-only queries — skips EF's change tracking overhead.
- Always use async: `ToListAsync()`, `FirstOrDefaultAsync()`, `SaveChangesAsync()`.

---

## Part 4: Angular Architecture

### Standalone Components (the current default)
Angular has moved away from `NgModule` for new code. Components declare their own dependencies:
```typescript
@Component({
  selector: 'app-animal-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './animal-list.component.html'
})
export class AnimalListComponent { }
```
Bootstrapping: `bootstrapApplication(AppComponent, appConfig)` instead of the old `platformBrowserDynamic().bootstrapModule(AppModule)`.

### Services & Dependency Injection
```typescript
@Injectable({ providedIn: 'root' })
export class AnimalService {
  private http = inject(HttpClient); // newer functional injection style
  getAnimals(): Observable<Animal[]> {
    return this.http.get<Animal[]>('/api/animals');
  }
}
```

### Signals vs RxJS
- **Signals** (`signal()`, `computed()`, `effect()`) are the newer reactivity primitive — synchronous, simple, great for local component state.
  ```typescript
  count = signal(0);
  doubled = computed(() => this.count() * 2);
  increment() { this.count.update(v => v + 1); }
  ```
- **RxJS** is still the tool for async streams — HTTP calls, websockets, user input events over time. Know both; signals didn't replace RxJS, they complement it.

### RxJS Operators Cheat Sheet
- `map` — transform emitted values.
- `filter` — only pass values matching a condition.
- `switchMap` — cancel the previous inner observable and switch to a new one. **Classic use case: typeahead search** (cancel the in-flight request when the user types again).
- `mergeMap` — run inner observables concurrently, don't cancel.
- `concatMap` — run inner observables sequentially, one after another.
- `tap` — side effects (logging) without altering the stream.
- `catchError` — handle errors in the pipe.
- `BehaviorSubject` — holds a current value, emits it immediately to new subscribers (good for shared state).

### Routing
```typescript
export const routes: Routes = [
  { path: 'animals', component: AnimalListComponent },
  { path: 'animals/:id', component: AnimalDetailComponent },
];
```
- Access route params via `ActivatedRoute` (inject and read `paramMap`).
- Navigate programmatically via `Router.navigate([...])`.
- Lazy loading: `loadComponent: () => import('./...')`.

### Forms: Reactive vs Template-driven
- **Reactive forms** (preferred for anything non-trivial): build the form model in the component with `FormGroup`/`FormControl`/`FormBuilder`, validators declared explicitly.
  ```typescript
  form = this.fb.group({
    name: ['', Validators.required],
    species: ['', Validators.required],
  });
  ```
- **Template-driven**: `[(ngModel)]` in the template, simpler but harder to test and scale.

### HttpClient & Interceptors
- `provideHttpClient()` in app config.
- `HttpClient` methods return `Observable`s — remember to `.subscribe()` or use the `async` pipe in templates.
- Interceptors are middleware-equivalent for HTTP requests — commonly used for attaching auth tokens or centralized error handling.

### Change Detection
- **Default**: checks the whole component tree on basically any event (DOM event, timer, HTTP response).
- **OnPush**: only re-checks a component when an `@Input()` reference changes, an event originates from it, or a signal it reads updates. Pairs naturally with signals for predictable, efficient updates.

---

## Part 5: The 2-Day Build Project

Build a small full-stack app — animal health monitoring — that exercises everything above.

> **Step-by-step design guides:** see [day1_dotnet_design_guide.md](day1_dotnet_design_guide.md) and [day2_angular_design_guide.md](day2_angular_design_guide.md).

### Day 1 — C# & ASP.NET Core (3-4 hrs build, after a 2-3 hr concept refresh)
- Controller-based ASP.NET Core Web API project.
- EF Core models: `Farm` → `Animal` (one-to-many) → `HealthRecord` (one-to-many).
- Full CRUD endpoints for each entity.
- Register `DbContext` as Scoped, add a service layer (`IAnimalService`/`AnimalService`) registered via DI.
- Swagger enabled for manual testing.
- Stretch: one endpoint that calls the OpenAI API to summarize an animal's recent health records — directly maps to the JD's "OpenAI technologies" line.

### Day 2 — Angular (3-4 hrs build, after a 2-3 hr concept refresh)
- Standalone components: `AnimalListComponent`, `AnimalDetailComponent`, `AnimalFormComponent`.
- `AnimalService` using `HttpClient` + `inject()` to call the Day 1 API.
- Reactive form for create/edit.
- Routing between list, detail, and form views.
- Stretch: use a signal for a simple piece of local UI state (e.g., loading indicator) and try `OnPush` change detection on the list component.

### Environment setup (Ubuntu)
```bash
# .NET SDK (10 is the current LTS, released Nov 2025)
sudo apt install dotnet-sdk-10.0

# Node + Angular CLI
npm install -g @angular/cli
```

---

## Quick Talking-Points Recap
- DI lifetimes, especially why `DbContext` must be Scoped.
- ASP.NET Core middleware pipeline ordering.
- `IQueryable` vs `IEnumerable` and why it matters for EF Core performance.
- Angular's shift to standalone components + signals, and how signals complement (not replace) RxJS.
- `switchMap` vs `mergeMap` vs `concatMap` — know the canonical use case for each.
- Reactive forms over template-driven for anything beyond a trivial form.
