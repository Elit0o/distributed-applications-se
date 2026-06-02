using Microsoft.EntityFrameworkCore;
using MovieTheatre.Data.Entities;
using MovieTheatre.Data.Persistance;

namespace MovieTheatre.Repository
{
    public class TicketRepository : Repository<Ticket>, ITicketRepository
    {
        public TicketRepository(MovieTheatreDbContext context) : base(context)
        {
        }

        public async Task<bool> IsSeatTaken(byte seatNum, Guid screeningId, Guid? ticketId = null)
        {
            return await _context.Tickets.AnyAsync(t =>
                t.SeatNum == seatNum &&
                t.ScreeningId == screeningId &&
                (ticketId == null || t.Id != ticketId));
        }
    }
}
