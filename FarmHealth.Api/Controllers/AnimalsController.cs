// Controllers/AnimalsController.cs
namespace FarmHealth.Api.Controllers;

using Microsoft.AspNetCore.Mvc;
using FarmHealth.Api.Dtos;
using FarmHealth.Api.Services;

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