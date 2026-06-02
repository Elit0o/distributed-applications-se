using MovieTheatre.Contracts.DTOs.Requests.Screenings;
using MovieTheatre.Data.Entities;

namespace MovieTheatre.Repository
{
    public interface IScreeningRepository : IRepository<Screening>
    {
        Task<bool> IsHallAvailable(ScreeningRequest request, Guid? screeningId = null);
    }
}
