using MovieTheatre.Data.Entities;

namespace MovieTheatre.Repository
{
    public interface ITicketRepository : IRepository<Ticket>
    {
        Task<bool> IsSeatTaken(byte seatNum, Guid screeningId, Guid? ticketId = null);
    }
}
