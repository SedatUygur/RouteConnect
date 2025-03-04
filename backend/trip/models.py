from django.db import models

# Create your models here.
class Trip(models.Model):
    """
    Stores the basic trip info.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    current_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    current_cycle_hours_used = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_distance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    estimated_duration = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    geometry = models.JSONField(default=list, blank=True)  # Store the route geometry as a list of coordinates

    # Additional fields: name of carrier, main office address, etc.
    name_of_carrier = models.CharField(max_length=255, blank=True)
    main_office_address = models.CharField(max_length=255, blank=True)
    home_terminal_address = models.CharField(max_length=255, blank=True)
    vehicle_number = models.CharField(max_length=255, blank=True)
    manifest_number = models.CharField(max_length=255, blank=True)
    shipper_company = models.CharField(max_length=255, blank=True)
    commodity = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"Trip {self.id} from {self.pickup_location} to {self.dropoff_location}"
    
class Stop(models.Model):
    """
    Each Stop can be fueling, rest, pickup, dropoff, etc.
    """
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='stops')
    stop_type = models.CharField(max_length=50)  # e.g. "Fuel", "Pickup", "Dropoff", "Rest"
    location = models.CharField(max_length=255)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.stop_type} stop at {self.location}"
    
class DailyLog(models.Model):
    """
    Stores summary of each day of driving for the trip (to fill out daily logs).
    """
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='logs')
    date = models.DateField()
    total_driving = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    total_on_duty = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    total_off_duty = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    total_sleeper_berth = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    # Optionally store JSON events for the day
    # Each event includes: start_time, end_time, status, remarks (city, state, reason)
    events = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"DailyLog {self.id} for {self.date}"