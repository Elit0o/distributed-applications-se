using Contracts.Interfaces;
using MovieTheatre.Contracts.DTOs.Requests.Ticket;
using MovieTheatre.Contracts.DTOs.Responses.Ticket;
using MovieTheatre.Data.Entities;

namespace MovieTheatre.Contracts.Interfaces
{
    public interface ITicketService : IBaseService<Ticket>
    {
        Task<TicketPageResponse> GetPagedAllTickets(TicketPageRequest request, Guid id);
        Task<List<int>> GetTakenSeatsByScreeningIdAsync(Guid screeningId);
        Ticket CreateTicket(TicketRequest request);
        Ticket UpdateTicket(TicketRequest request, Ticket ticket);
        TicketDetailsResponse MapToResponse(Ticket ticket);
        Task<bool> IsSeatTaken(byte seatNum, Guid screeningId, Guid? ticketId = null);
    }
}
