using Microsoft.EntityFrameworkCore;
using MovieTheatre.Contracts.DTOs.Requests.Screenings;
using MovieTheatre.Contracts.DTOs.Responses.Screenings;
using MovieTheatre.Contracts.DTOs.Responses.Ticket;
using MovieTheatre.Contracts.Interfaces;
using MovieTheatre.Data.Entities;
using MovieTheatre.Data.Persistance;
using MovieTheatre.Repository;

namespace MovieTheatre.Services
{
    public class ScreeningService : BaseService<Screening>, IScreeningService
    {
        private readonly IScreeningRepository _screeningRepository;
        public ScreeningService(IScreeningRepository repository, MovieTheatreDbContext dbContext) : base(repository, dbContext)
        {
            _screeningRepository = repository;
        }

        public Screening CreateScreening(ScreeningRequest screeningRequest)
        {
            var movie = _dbContext.Movies.FirstOrDefault(m => m.Id == screeningRequest.MovieId);
            int duration = movie != null ? movie.DurationMinutes : 120;

            DateTime modifiedOn = DateTime.UtcNow;
            return new Screening
            {
                Id = Guid.NewGuid(),
                StartTime = screeningRequest.StartTime,
                EndTime = screeningRequest.StartTime.AddMinutes(duration),
                Price = screeningRequest.Price,
                Type = screeningRequest.Type,
                MovieId = screeningRequest.MovieId,
                HallId = screeningRequest.HallId,
                CreatedOn = modifiedOn,
                UpdatedOn = modifiedOn
            };
        }

        public async Task<ScreeningPageResponse> GetPagedAllScreenings(ScreeningPageRequest screeningPageRequest)
        {
            int page = Math.Max(screeningPageRequest.Page, 1);
            int pageSize = Math.Clamp(screeningPageRequest.PageSize, 1, 30);

            var screeningQuery = _screeningRepository.GetAllQueryable();

            if (!string.IsNullOrWhiteSpace(screeningPageRequest.Type))
            {
                screeningQuery = screeningQuery.Where(s => s.Type.ToString() == screeningPageRequest.Type);
            }

            if (!string.IsNullOrWhiteSpace(screeningPageRequest.Title))
            {
                var title = screeningPageRequest.Title.Trim().ToLower();
                screeningQuery = screeningQuery.Where(s => s.Movie.Title.ToLower().Contains(title));
            }

            if (!string.IsNullOrWhiteSpace(screeningPageRequest.Genre))
            {
                var genre = screeningPageRequest.Genre.Trim().ToLower();
                screeningQuery = screeningQuery.Where(s => s.Movie.Genre.ToLower().Contains(genre));
            }

            if (screeningPageRequest.Date.HasValue)
            {
                var date = screeningPageRequest.Date.Value.Date;
                screeningQuery = screeningQuery.Where(s => s.StartTime.Date == date);
            }

            string sortBy = screeningPageRequest.SortBy ?? nameof(Screening.StartTime);
            screeningQuery = sortBy switch
            {
                nameof(Screening.Price) => screeningPageRequest.IsDescending ? screeningQuery.OrderByDescending(s => s.Price) : screeningQuery.OrderBy(s => s.Price),
                nameof(Screening.EndTime) => screeningPageRequest.IsDescending ? screeningQuery.OrderByDescending(s => s.EndTime) : screeningQuery.OrderBy(s => s.EndTime),
                nameof(Screening.StartTime) => screeningPageRequest.IsDescending ? screeningQuery.OrderByDescending(s => s.StartTime) : screeningQuery.OrderBy(s => s.StartTime),
                _ => screeningPageRequest.IsDescending ? screeningQuery.OrderByDescending(s => s.StartTime) : screeningQuery.OrderBy(s => s.StartTime)
            };

            var totalCount = await screeningQuery.CountAsync();
            var screenings = await screeningQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new ScreeningResponse
                {
                    Id = s.Id,
                    StartTime = s.StartTime,
                    EndTime = s.EndTime,
                    MovieTitle = s.Movie != null ? s.Movie.Title : string.Empty,
                    MovieId = s.MovieId,
                    HallId = s.HallId,
                    Price = s.Price,
                    Type = s.Type.ToString()
                })
                .ToListAsync();

            return new ScreeningPageResponse
            {
                Items = screenings,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                IsDescending = screeningPageRequest.IsDescending,
                Type = screeningPageRequest.Type
            };
        }

        public async Task<bool> IsHallAvailable(ScreeningRequest screeningRequest, Guid? screeningId = null)
        {
            return await _screeningRepository.IsHallAvailable(screeningRequest, screeningId);
        }

        public ScreeningDetailsResponse MapToResponse(Screening screening)
        {
            return new ScreeningDetailsResponse
            {
                Id = screening.Id,
                StartTime = screening.StartTime,
                EndTime = screening.EndTime,
                Price = screening.Price,
                Type = screening.Type,
                MovieId = screening.MovieId,
                HallId = screening.HallId,
                Tickets = screening.Tickets != null ? screening.Tickets.Select(t => new TicketResponse
                {
                    Id = t.Id,
                    SeatNum = t.SeatNum,
                }).ToList() : new List<TicketResponse>()
            };
        }

        public Screening UpdateScreening(ScreeningRequest screeningRequest, Screening screening)
        {
            screening.HallId = screeningRequest.HallId;
            screening.MovieId = screeningRequest.MovieId;
            screening.Price = screeningRequest.Price;
            screening.StartTime = screeningRequest.StartTime;
            screening.EndTime = screeningRequest.EndTime;
            screening.Type = screeningRequest.Type;

            return screening;
        }
    }
}
