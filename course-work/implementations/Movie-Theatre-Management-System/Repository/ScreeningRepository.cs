using Microsoft.EntityFrameworkCore;
using MovieTheatre.Contracts.DTOs.Requests.Screenings;
using MovieTheatre.Data.Entities;
using MovieTheatre.Data.Persistance;

namespace MovieTheatre.Repository
{
    public class ScreeningRepository : Repository<Screening>, IScreeningRepository
    {
        public ScreeningRepository(MovieTheatreDbContext context) : base(context)
        {
        }

        public async Task<bool> IsHallAvailable(ScreeningRequest screeningRequest, Guid? screeningId = null)
        { 
            var movie = await _context.Movies.FirstOrDefaultAsync(m => m.Id == screeningRequest.MovieId);
            if (movie == null) return false;

            var newStart = screeningRequest.StartTime;
            var newEnd = screeningRequest.StartTime.AddMinutes(movie.DurationMinutes);

            var screeningsInHall = await _dbSet
                .Where(s => s.HallId == screeningRequest.HallId && (screeningId == null || s.Id != screeningId))
                .ToListAsync();

            bool hasOverlap = screeningsInHall.Any(s =>
                newStart < s.EndTime && newEnd > s.StartTime);

            return !hasOverlap;
        }
    }
}
