using System.ServiceModel;

namespace RideSharing.Contracts;

[ServiceContract]
public interface IRideBookingService
{
    [OperationContract(IsOneWay = true)]
    void RequestRide(RideRequest request);

    [OperationContract(IsOneWay = true)]
    void CancelRide(Guid requestId);
}
