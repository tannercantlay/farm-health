// Controllers/FarmsController.cs
namespace FarmHealth.Api.Controllers;

using Microsoft.AspNetCore.Mvc;
using FarmHealth.Api.Dtos;
using FarmHealth.Api.Services;

[ApiController]
[Route("api/[controller]")]
public class FarmsController(IFarmService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<FarmResponse>>> GetAll() =>
        Ok(await service.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<FarmResponse>> GetById(int id) =>
        await service.GetByIdAsync(id) is { } f ? Ok(f) : NotFound();

    [HttpPost]
    public async Task<ActionResult<FarmResponse>> Create(CreateFarmRequest req)
    {
        var created = await service.CreateAsync(req);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateFarmRequest req) =>
        await service.UpdateAsync(id, req) ? NoContent() : NotFound();

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) =>
        await service.DeleteAsync(id) ? NoContent() : NotFound();
}
