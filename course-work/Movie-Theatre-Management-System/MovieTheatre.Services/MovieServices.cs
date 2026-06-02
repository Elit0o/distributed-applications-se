using Microsoft.EntityFrameworkCore;
using MovieTheatre.Contracts.DTOs.Requests.Movies;
using MovieTheatre.Contracts.DTOs.Responses.Movies;
using MovieTheatre.Contracts.DTOs.Responses.Screenings;
using MovieTheatre.Contracts.Interfaces;
using MovieTheatre.Data.Entities;
using MovieTheatre.Data.Persistance;
using MovieTheatre.Repository;

namespace MovieTheatre.Services
{
    public class MovieServices : BaseService<Movie>, IMovieService
    {
        private readonly IMovieRepository _movieRepository;

        public MovieServices(IMovieRepository repository, MovieTheatreDbContext dbContext) : base(repository, dbContext)
        {
            _movieRepository = repository;
        }

        public Movie CreateMovie(MovieRequest movieRequest)
        {
            DateTime modifiedOn = DateTime.UtcNow;
            return new Movie
            {
                Id = Guid.NewGuid(),
                Title = movieRequest.Title,
                Genre = movieRequest.Genre,
                ReleaseDate = movieRequest.ReleaseDate,
                DurationMinutes = movieRequest.DurationMinutes,
                Description = movieRequest.Description,
                Rating = movieRequest.Rating,
                CreatedOn = modifiedOn,
                UpdatedOn = modifiedOn
            };
        }

        public async Task<MoviePageResponse> GetPagedAllMovies(MoviePageRequest moviePageRequest)
        {
            int page = Math.Max(moviePageRequest.Page, 1);
            int pageSize = Math.Clamp(moviePageRequest.PageSize, 1, 30);

            var movieQuery = _movieRepository.GetAllQueryable();
            if (!string.IsNullOrWhiteSpace(moviePageRequest.Title))
            {
                movieQuery = movieQuery.Where(m => m.Title == moviePageRequest.Title);
            }
            if (!string.IsNullOrWhiteSpace(moviePageRequest.Genre))
            {
                movieQuery = movieQuery.Where(m => m.Genre == moviePageRequest.Genre);
            }

            string sortBy = moviePageRequest.SortBy ?? nameof(Movie.Rating);
            movieQuery = sortBy switch
            {
                nameof(Movie.Title) => moviePageRequest.IsDescending ? movieQuery.OrderByDescending(m => m.Title) : movieQuery.OrderBy(m => m.Title),
                nameof(Movie.Genre) => moviePageRequest.IsDescending ? movieQuery.OrderByDescending(m => m.Genre) : movieQuery.OrderBy(m => m.Genre),
                nameof(Movie.ReleaseDate) => moviePageRequest.IsDescending ? movieQuery.OrderByDescending(m => m.ReleaseDate) : movieQuery.OrderBy(m => m.ReleaseDate),
                nameof(Movie.DurationMinutes) => moviePageRequest.IsDescending ? movieQuery.OrderByDescending(m => m.DurationMinutes) : movieQuery.OrderBy(m => m.DurationMinutes),
                nameof(Movie.Rating) => moviePageRequest.IsDescending ? movieQuery.OrderByDescending(m => m.Rating) : movieQuery.OrderBy(m => m.Rating),
                _ => moviePageRequest.IsDescending ? movieQuery.OrderByDescending(m => m.Rating) : movieQuery.OrderBy(m => m.Rating)
            };

            var totalItems = await movieQuery.CountAsync();
            var items = await movieQuery.Skip((page - 1) * pageSize)
                                        .Take(pageSize)
                                        .Select(m => new MovieResponse { Id = m.Id, Title = m.Title, Genre = m.Genre, ReleaseDate = m.ReleaseDate, DurationMinutes = m.DurationMinutes, Description = m.Description, Rating = m.Rating })
                                        .ToListAsync();

            return new MoviePageResponse
            {
                Items = items,
                TotalCount = totalItems,
                Page = page,
                PageSize = pageSize,
                IsDescending = moviePageRequest.IsDescending,
                Title = moviePageRequest.Title,
                Genre = moviePageRequest.Genre
            };

        }

        public MovieDetailsResponse MapToResponse(Movie movie)
        {
            return new MovieDetailsResponse
            {
                Title = movie.Title,
                Genre = movie.Genre,
                ReleaseDate = movie.ReleaseDate,
                DurationMinutes = movie.DurationMinutes,
                Description = movie.Description,
                Rating = movie.Rating,
                Screenings = movie.Screenings.Select(s => new ScreeningResponse
                {
                    Id = s.Id,
                    StartTime = s.StartTime,
                    EndTime = s.EndTime,
                    HallId = s.HallId
                }).ToList()
            };
        }

        public async Task<bool> MovieExistsAsync(string title)
        {
            return await _movieRepository.MovieExistsAsync(title);
        }

        public Movie UpdateMovie(MovieRequest movieRequest, Movie movie)
        {
            movie.Title = movieRequest.Title;
            movie.Genre = movieRequest.Genre;
            movie.ReleaseDate = movieRequest.ReleaseDate;
            movie.DurationMinutes = movieRequest.DurationMinutes;
            movie.Description = movieRequest.Description;
            movie.Rating = movieRequest.Rating;

            return movie;
        }
    }
}
