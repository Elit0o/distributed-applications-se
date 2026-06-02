using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MovieTheatre.Contracts.DTOs.Requests.Halls;
using MovieTheatre.Contracts.DTOs.Responses.Halls;
using MovieTheatre.Contracts.Interfaces;
using MovieTheatre.Data.Entities;
using MovieTheatre.WebServices.Exceptions;

namespace MovieTheatre.WebServices.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HallController : ControllerBase
    {
        private readonly IHallService _hallService;
        public HallController(IHallService hallService)
        {
            _hallService = hallService;
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] HallPageRequest request)
        {
            var response = await _hallService.GetPagedAllHalls(request);
            return Ok(response);
        }

        [Authorize]
        [HttpGet]
        [Route("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            Hall? hall = await _hallService.GetByIdAsync(id);
            if (hall == null)
            {
                throw new NotFoundException($"Hall with id {id} not found");
            }
            var response = _hallService.MapToResponse(hall);
            return Ok(response);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] HallRequest hallRequest)
        {
            if (!ModelState.IsValid)
            {
                throw new BadRequestException("Invalid data");
            }

            if (!User.HasClaim("isAdmin", "True")) return Forbid();

            var hall = _hallService.CreateHall(hallRequest);
            await _hallService.AddAsync(hall);
            return Created();
        }

        [Authorize]
        [HttpPut]
        [Route("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] HallRequest hallRequest)
        {
            if (!ModelState.IsValid)
            {
                throw new BadRequestException("Invalid data");
            }

            if (!User.HasClaim("isAdmin", "True")) return Forbid();

            var hall = await _hallService.GetByIdAsync(id);
            if (hall == null)
            {
                throw new NotFoundException($"Hall with id {id} not found");
            }

            var updated = _hallService.UpdateHall(hallRequest, hall);
            await _hallService.UpdateAsync(updated);
            HallDetailsResponse response = _hallService.MapToResponse(updated);
            return Ok(response);
        }

        [Authorize]
        [HttpDelete]
        [Route("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            if (!User.HasClaim("isAdmin", "True")) return Forbid();

            var hall = await _hallService.GetByIdAsync(id);
            if (hall == null)
            {
                throw new NotFoundException($"Hall with id {id} not found");
            }
            HallDetailsResponse response = _hallService.MapToResponse(hall);
            await _hallService.DeleteAsync(hall);
            return Ok(response);
        }
    }
}