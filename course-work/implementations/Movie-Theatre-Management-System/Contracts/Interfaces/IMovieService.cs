using Contracts.Interfaces;
using MovieTheatre.Contracts.DTOs.Requests.Movies;
using MovieTheatre.Contracts.DTOs.Responses.Movies;
using MovieTheatre.Data.Entities;

namespace MovieTheatre.Contracts.Interfaces
{
    public interface IMovieService : IBaseService<Movie>
    {
        Task<MoviePageResponse> GetPagedAllMovies(MoviePageRequest moviePageRequest);
        Movie CreateMovie(MovieRequest movieRequest);
        Movie UpdateMovie(MovieRequest movieRequest, Movie movie);
        MovieDetailsResponse MapToResponse(Movie movie);
        Task<bool> MovieExistsAsync(string title);
    }
}
