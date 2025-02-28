from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Trip
from .serializers import TripSerializer
from .services.route_and_hos_service import calculate_trip_stops
# Create your views here.
class TripViewSet(viewsets.ModelViewSet):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer

    @action(detail=True, methods=['post'])
    def calculate_route(self, request, pk=None):
        trip = self.get_object()
        calculate_trip_stops(trip, None, True)
        serializer = TripSerializer(trip)
        return Response(serializer.data, status=status.HTTP_200_OK)