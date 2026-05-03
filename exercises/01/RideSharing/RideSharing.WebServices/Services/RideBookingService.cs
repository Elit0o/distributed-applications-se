using Microsoft.Extensions.Logging;
using RideSharing.Contracts;
using RideSharing.WebServices.Stores;
using System;

namespace RideSharing.WebServices.Services;

public class RideBookingService : IRideBookingService, IRideStatusService
{
    private readonly ILogger<RideBookingService> _logger;
    private readonly IRideRequestStore _store;

    public RideBookingService(ILogger<RideBookingService> logger, IRideRequestStore store)
    {
        _logger = logger;
        _store = store;
    }

    public void RequestRide(RideRequest request)
    {
        _logger.LogInformation(
            "Ride received — RequestId: {RequestId}, Pickup: {Pickup}, Dropoff: {Dropoff}, Status: {Status}", request.RequestId, request.PickupLocation, request.DropoffLocation, request.Status);

        _store.Add(request);

        _logger.LogInformation("Ride {RequestId} persisted to in-memory store.", request.RequestId);
    }

    public void CancelRide(Guid requestId)
    {
        var ride = _store.GetById(requestId);
        if (ride is null)
        {
            _logger.LogWarning("Cancel failed – Ride {RequestId} not found.", requestId);
        }

        if (ride.Status is RideStatus.Completed or RideStatus.Assigned)
        {
            _logger.LogWarning(
                "Cancel failed – Ride {RequestId} is already {Status}.",
                requestId, ride.Status);
        }

        ride.Status = RideStatus.Cancelled;
        _logger.LogInformation("Ride {RequestId} has been cancelled.", requestId);
    }

    public RideStatus GetRideStatus(Guid requestId)
    {
        var ride = _store.GetById(requestId);
        if (ride is null)
        {
            _logger.LogWarning("Ride {RequestId} not found.", requestId);
            return RideStatus.Created;
        }

        _logger.LogInformation("Ride {RequestId} status: {Status}", requestId, ride.Status);
        return ride.Status;
    }
}
