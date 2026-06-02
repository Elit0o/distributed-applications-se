using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MovieTheatre.Contracts.DTOs.Requests.Screenings;
using MovieTheatre.Contracts.DTOs.Responses.Screenings;
using MovieTheatre.Contracts.Interfaces;
using MovieTheatre.WebServices.Exceptions;

namespace MovieTheatre.WebServices.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ScreeningController : ControllerBase
    {
        private readonly IScreeningService _screeningService;

        public ScreeningController(IScreeningService screeningService)
        {
            _screeningService = screeningService;
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] ScreeningPageRequest screeningPageRequest) 
        {
            var response = await _screeningService.GetPagedAllScreenings(screeningPageRequest);
            return Ok(response);
        }

        [Authorize]
        [HttpGet]
        [Route("{id}")]
        public async Task<IActionResult> Get([FromRoute] Guid id) 
        {
            var screening = await _screeningService.GetByIdAsync(id);
            if (screening == null)
            {
                throw new NotFoundException($"Movie with id {id} not found");
            }
            var response = _screeningService.MapToResponse(screening);
            return Ok(response);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ScreeningRequest request) 
        {
            if (!ModelState.IsValid)
            {
                throw new BadRequestException("Invalid data");
            }

            if (!User.HasClaim("isAdmin", "True"))
            {
                return Forbid();
            }

            if (!await _screeningService.IsHallAvailable(request))
            {
                throw new BadRequestException("The hall is not available for the given time slot.");
            }

            var screening = _screeningService.CreateScreening(request);
            await _screeningService.AddAsync(screening);
            return Created();
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update([FromRoute] Guid id, [FromBody] ScreeningRequest request)
        {
            if (!ModelState.IsValid)
            {
                throw new BadRequestException("Invalid data");
            }

            if (!User.HasClaim("isAdmin", "True"))
            {
                return Forbid();
            }
            var screening = await _screeningService.GetByIdAsync(id);
            if (screening == null)
            {
                throw new NotFoundException($"Screening with id {id} not found");
            }

            if (!await _screeningService.IsHallAvailable(request, id))
            {
                throw new BadRequestException("Choosen hall is taken for this time slot by another screening.");
            }
            screening.HallId = request.HallId;
            screening.MovieId = request.MovieId;
            screening.StartTime = request.StartTime;
            screening.EndTime = request.EndTime;
            screening.Price = request.Price;
            screening.Type = request.Type;
            screening.UpdatedOn = DateTime.UtcNow;

            await _screeningService.UpdateAsync(screening);

            ScreeningDetailsResponse response = _screeningService.MapToResponse(screening);
            return Ok(response);
        }

        [Authorize]
        [HttpDelete]
        [Route("{id}")]
        public async Task<IActionResult> Delete([FromRoute] Guid id)
        {
            if (!User.HasClaim("isAdmin", "True"))
            {
                return Forbid();
            }
            var screening = await _screeningService.GetByIdAsync(id);
            if (screening == null)
            {
                throw new NotFoundException($"Screening with id {id} not found");
            }
            ScreeningDetailsResponse response = _screeningService.MapToResponse(screening);
            await _screeningService.DeleteAsync(screening);
            return Ok(response);
        }
    }
}
