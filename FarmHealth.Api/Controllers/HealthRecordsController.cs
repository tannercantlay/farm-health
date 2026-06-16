// Controllers/HealthRecordsController.cs
namespace FarmHealth.Api.Controllers;

using Microsoft.AspNetCore.Mvc;
using FarmHealth.Api.Dtos;
using FarmHealth.Api.Services;

[ApiController]
[Route("api/animals/{animalId:int}/healthrecords")]
public class HealthRecordsController(IHealthRecordService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<HealthRecordResponse>>> GetByAnimal(int animalId) =>
        Ok(await service.GetByAnimalIdAsync(animalId));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<HealthRecordResponse>> GetById(int animalId, int id) =>
        await service.GetByIdAsync(id) is { } h ? Ok(h) : NotFound();

    [HttpPost]
    public async Task<ActionResult<HealthRecordResponse>> Create(int animalId, CreateHealthRecordRequest req)
    {
        var created = await service.CreateAsync(req);
        return CreatedAtAction(nameof(GetById), new { animalId, id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int animalId, int id, UpdateHealthRecordRequest req) =>
        await service.UpdateAsync(id, req) ? NoContent() : NotFound();

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int animalId, int id) =>
        await service.DeleteAsync(id) ? NoContent() : NotFound();
}
