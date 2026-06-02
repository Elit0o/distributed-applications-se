using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MovieTheatre.Contracts.DTOs.Requests.Ticket;
using MovieTheatre.Contracts.DTOs.Responses.Ticket;
using MovieTheatre.Contracts.Interfaces;
using MovieTheatre.WebServices.Exceptions;
using System.Security.Claims;


namespace MovieTheatre.WebServices.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TicketController : ControllerBase
    {
        private readonly ITicketService _ticketService;

        public TicketController(ITicketService ticketService)
        {
            _ticketService = ticketService;
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] TicketPageRequest request)
        {
            Guid loggedUserId = Guid.Parse(User.FindFirstValue("loggedUserId"));

            var response = await _ticketService.GetPagedAllTickets(request, loggedUserId);
            return Ok(response);
        }

        [Authorize]
        [HttpGet]
        [Route("{id}")]
        public async Task<IActionResult> Get([FromRoute] Guid id)
        {
            Guid loggedUserId = Guid.Parse(User.FindFirstValue("loggedUserId"));

            var ticket = await _ticketService.GetByIdAsync(id);
            if (ticket == null)
            {
                throw new NotFoundException($"Ticket with id {id} not found");
            }
            if (ticket.UserId != loggedUserId && !User.HasClaim("isAdmin", "True"))
            {
                return Forbid();
            }
            var response = _ticketService.MapToResponse(ticket);
            return Ok(response);
        }

        [Authorize]
        [HttpGet("screening/{screeningId}/seats")]
        public async Task<IActionResult> GetTakenSeatsForScreening(Guid screeningId)
        {
            var takenSeats = await _ticketService.GetTakenSeatsByScreeningIdAsync(screeningId);

            return Ok(takenSeats);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] TicketRequest request)
        {
            if (!ModelState.IsValid)
            {
                throw new BadRequestException("Invalid data");
            }
            Guid loggedUserId = Guid.Parse(User.FindFirstValue("loggedUserId"));

            if (await _ticketService.IsSeatTaken(request.SeatNum, request.ScreeningId)) 
            {
                throw new BadRequestException($"Seat {request.SeatNum} is already taken for screening with id {request.ScreeningId}");
            }
            var ticket = _ticketService.CreateTicket(request);
            ticket.UserId = loggedUserId;
            await _ticketService.AddAsync(ticket);
            return Created();
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update([FromRoute] Guid id, [FromBody] TicketRequest request)
        {
            if (!ModelState.IsValid)
            {
                throw new BadRequestException("Invalid data");
            }

            Guid loggedUserId = Guid.Parse(User.FindFirstValue("loggedUserId"));

            var ticket = await _ticketService.GetByIdAsync(id);
            if (ticket == null)
            {
                throw new NotFoundException($"Ticket with ID {id} not found.");
            }
            if (ticket.UserId != loggedUserId)
            {
                return Forbid();
            }

             
            if (await _ticketService.IsSeatTaken(request.SeatNum, request.ScreeningId, id))
            {
                throw new BadRequestException($"Seat N{request.SeatNum} is already taken for screening with id {request.ScreeningId}");
            }


            var updatedTicket = _ticketService.UpdateTicket(request, ticket);
            updatedTicket.UserId = loggedUserId;
            await _ticketService.UpdateAsync(updatedTicket);

            TicketDetailsResponse response = _ticketService.MapToResponse(updatedTicket);
            return Ok(response);
        }

        [Authorize]
        [HttpDelete]
        [Route("{id}")]
        public async Task<IActionResult> Delete([FromRoute] Guid id)
        {
            Guid loggedUserId = Guid.Parse(User.FindFirstValue("loggedUserId"));
            var ticket = await _ticketService.GetByIdAsync(id);
            if (ticket == null)
            {
                throw new NotFoundException($"Ticket with id {id} not found");
            }
            if (ticket.UserId != loggedUserId)
            {
                return Forbid();
            }
            TicketDetailsResponse response = _ticketService.MapToResponse(ticket);
            await _ticketService.DeleteAsync(ticket);
            return Ok(response);
        }
    }
}
