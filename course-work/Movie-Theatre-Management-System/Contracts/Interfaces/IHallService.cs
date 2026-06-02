using Contracts.Interfaces;
using MovieTheatre.Contracts.DTOs.Requests.Halls;
using MovieTheatre.Contracts.DTOs.Responses.Halls;
using MovieTheatre.Data.Entities;

namespace MovieTheatre.Contracts.Interfaces
{
    public interface IHallService : IBaseService<Hall>
    {
        Task<HallPageResponse> GetPagedAllHalls(HallPageRequest hallPageRequest);
        Hall CreateHall(HallRequest hallRequest);
        Hall UpdateHall(HallRequest hallRequest, Hall hall);
        HallDetailsResponse MapToResponse(Hall hall);
    }
}
