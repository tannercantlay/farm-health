using Microsoft.EntityFrameworkCore;
using FarmHealth.Api.Data;
using FarmHealth.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlite(builder.Configuration.GetConnectionString("Default")));
builder.Services.AddScoped<IAnimalService, AnimalService>();
builder.Services.AddScoped<IFarmService, FarmService>();
builder.Services.AddScoped<IHealthRecordService, HealthRecordService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
// Order matters — exception handling wraps everything, routing before auth, auth before endpoints.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi(); // .NET 10 built-in OpenAPI doc generation at /openapi/v1.json
    app.UseSwaggerUI(o => o.SwaggerEndpoint("/openapi/v1.json", "FarmHealth"));
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();
