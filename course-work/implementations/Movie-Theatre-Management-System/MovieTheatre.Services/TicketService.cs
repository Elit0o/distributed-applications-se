using Microsoft.EntityFrameworkCore;
using MovieTheatre.Contracts.DTOs.Requests.Ticket;
using MovieTheatre.Contracts.DTOs.Responses.Screenings;
using MovieTheatre.Contracts.DTOs.Responses.Ticket;
using MovieTheatre.Contracts.Interfaces;
using MovieTheatre.Data.Entities;
using MovieTheatre.Data.Persistance;
using MovieTheatre.Repository;


namespace MovieTheatre.Services
{
    public class TicketService : BaseService<Ticket>, ITicketService
    {
        private readonly ITicketRepository _ticketRepository;
        public TicketService(ITicketRepository repository, MovieTheatreDbContext dbContext) : base(repository, dbContext)
        {
            _ticketRepository = repository;
        }

        public async Task<List<int>> GetTakenSeatsByScreeningIdAsync(Guid screeningId)
        {
            return await _ticketRepository.GetAllQueryable()
                .Where(t => t.ScreeningId == screeningId)
                .Select(t => (int)t.SeatNum)
                .ToListAsync();
        }

        public Ticket CreateTicket(TicketRequest request)
        {
            DateTime modifiedOn = DateTime.UtcNow;
            return new Ticket
            {
                Id = Guid.NewGuid(),
                ScreeningId = request.ScreeningId,
                SeatNum = request.SeatNum,
                PurchasedAt = request.PurchasedAt,
                PhoneNumber = request.PhoneNumber,
                CreatedOn = modifiedOn,
                UpdatedOn = modifiedOn
            };
        }

        public async Task<TicketPageResponse> GetPagedAllTickets(TicketPageRequest request, Guid id)
        {
            int page = Math.Max(request.Page, 1);
            int pageSize = Math.Clamp(request.PageSize, 1, 30);

            var ticketQuery = _ticketRepository.GetAllQueryable();
            ticketQuery = ticketQuery.Where(t => t.UserId == id);
            ticketQuery = request.IsDescending ? ticketQuery.OrderByDescending(t => t.CreatedOn) : ticketQuery.OrderBy(t => t.CreatedOn);
            var totalCount = await ticketQuery.CountAsync();
            var tickets = await ticketQuery.Skip((page - 1) * pageSize).Take(pageSize).Select(t => new TicketResponse
            {
                Id = t.Id,
                SeatNum = t.SeatNum,
                PurchasedAt = t.PurchasedAt,
                PhoneNumber = t.PhoneNumber,
                MovieTitle = t.Screening.Movie.Title,
                ScreeningStartTime = t.Screening.StartTime
            }).ToListAsync();

            return new TicketPageResponse
            {
                Items = tickets,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                IsDescending = request.IsDescending,
                MovieTitle = tickets.FirstOrDefault()?.MovieTitle ?? string.Empty
            };
        }

        public Task<bool> IsSeatTaken(byte seatNum, Guid screeningId, Guid? ticketId = null)
        {
            return _ticketRepository.IsSeatTaken(seatNum, screeningId, ticketId);
        }

        public TicketDetailsResponse MapToResponse(Ticket ticket)
        {
            return new TicketDetailsResponse
            {
                Id = ticket.Id,
                SeatNum = ticket.SeatNum,
                PurchasedAt = ticket.PurchasedAt,
                PhoneNumber = ticket.PhoneNumber,
                ScreeningDetails = new ScreeningDetailsResponse
                {
                    MovieId = ticket.Screening.Movie.Id,
                    StartTime = ticket.Screening.StartTime,
                    EndTime = ticket.Screening.EndTime,
                    Price = ticket.Screening.Price,
                    Type = ticket.Screening.Type,
                    HallId = ticket.Screening.HallId
                }
            };
        }

        public Ticket UpdateTicket(TicketRequest request, Ticket ticket)
        {
            ticket.SeatNum = request.SeatNum;
            ticket.PurchasedAt = request.PurchasedAt;
            ticket.PhoneNumber = request.PhoneNumber;
            ticket.UpdatedOn = DateTime.UtcNow;
            return ticket;
        }
    }
}