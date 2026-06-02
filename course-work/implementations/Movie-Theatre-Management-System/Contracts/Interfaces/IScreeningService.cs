using Contracts.Interfaces;
using MovieTheatre.Contracts.DTOs.Requests.Screenings;
using MovieTheatre.Contracts.DTOs.Responses.Screenings;
using MovieTheatre.Data.Entities;

namespace MovieTheatre.Contracts.Interfaces
{
    public interface IScreeningService : IBaseService<Screening>
    {
        Task<ScreeningPageResponse> GetPagedAllScreenings(ScreeningPageRequest screeningPageRequest);

        Screening CreateScreening(ScreeningRequest screeningRequest);
        Screening UpdateScreening(ScreeningRequest screeningRequest, Screening screening);
        ScreeningDetailsResponse MapToResponse(Screening screening);
        Task<bool> IsHallAvailable(ScreeningRequest request, Guid? screeningId = null);
    }
}
