using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MovieTheatre.Contracts.DTOs.Requests.Movies;
using MovieTheatre.Contracts.DTOs.Responses.Movies;
using MovieTheatre.Contracts.Interfaces;
using MovieTheatre.Data.Entities;
using MovieTheatre.WebServices.Exceptions;

namespace MovieTheatre.WebServices.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MovieController : ControllerBase
    {
        private readonly IMovieService _movieService;

        public MovieController(IMovieService movieService)
        {
            _movieService = movieService;
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] MoviePageRequest request)
        {
            var response = await _movieService.GetPagedAllMovies(request);
            return Ok(response);
        }

        [Authorize]
        [HttpGet]
        [Route("{id}")]
        public async Task<IActionResult> Get([FromRoute] Guid id)
        {
            var movie = await _movieService.GetByIdAsync(id);
            if (movie == null)
            {
                throw new NotFoundException($"Movie with id {id} not found");
            }
            var response = _movieService.MapToResponse(movie);
            return Ok(response);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] MovieRequest request)
        {

            if (!ModelState.IsValid)
            {
                throw new BadRequestException("Invalid data");
            }

            if (!User.HasClaim("isAdmin", "True"))
            {
                return Forbid();
            }

            if (await _movieService.MovieExistsAsync(request.Title))
            {
                throw new BadRequestException($"Movie with title {request.Title} already exists");
            }

            var movie = _movieService.CreateMovie(request);
            await _movieService.AddAsync(movie);
            return Created();
        }

        [Authorize]
        [HttpPut]
        [Route("{id}")]
        public async Task<IActionResult> Update([FromRoute] Guid id, [FromBody] MovieRequest request)
        {
            if (!ModelState.IsValid)
            {
                throw new BadRequestException("Invalid data");
            }

            if (!User.HasClaim("isAdmin", "True"))
            {
                return Forbid();
            }

            Movie? movie = await _movieService.GetByIdAsync(id);
            if (movie == null)
            {
                throw new NotFoundException($"Movie with id {id} not found");
            }

            if (await _movieService.MovieExistsAsync(request.Title) && request.Title != movie.Title)
            {
                throw new BadRequestException($"Movie with title {request.Title} already exists");
            }
            _movieService.UpdateMovie(request, movie);
            await _movieService.UpdateAsync(movie);
            MovieDetailsResponse response = _movieService.MapToResponse(movie);
            return Ok();
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

            var movie = await _movieService.GetByIdAsync(id);
            if (movie == null)
            {
                throw new NotFoundException($"Movie with id {id} not found");
            }

            MovieDetailsResponse response = _movieService.MapToResponse(movie);
            await _movieService.DeleteAsync(movie);
            return Ok(response);
        }
    }
}
