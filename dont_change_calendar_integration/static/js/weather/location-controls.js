// Weather Location Controls: moves inline logic out of the template

import { api } from '../api.js';

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 6px;
    color: white;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

async function updateWeatherLocation(locationInput, updateBtn) {
  const newLocation = locationInput.value.trim();
  if (!newLocation) {
    showNotification('Please enter a location', 'error');
    return;
  }
  try {
    updateBtn.disabled = true;
    updateBtn.textContent = 'Updating...';

    await api.post('/calendar/weather/location', { location: newLocation });
    localStorage.setItem('weatherLocation', newLocation);

    const weatherData = await api.get(`/calendar/weather?location=${encodeURIComponent(newLocation)}`);
    const weatherEvents = weatherData.data?.weather_events || weatherData.weather_events || [];

    if (window.calendar) {
      const existingEvents = window.calendar.getEvents();
      existingEvents.forEach(event => {
        if (event.extendedProps?.type === 'weather-warning') {
          event.remove();
        }
      });

      weatherEvents.forEach(event => {
        try {
          window.calendar.addEvent({
            id: event.event_id || `weather-${Date.now()}-${Math.random()}`,
            title: event.title,
            start: event.start_time,
            end: event.end_time,
            allDay: true,
            backgroundColor: '#ffb3b3',
            borderColor: '#ff8080',
            textColor: '#d00000',
            editable: false,
            classNames: ['fc-event-weather'],
            extendedProps: {
              type: 'weather-warning',
              // Removed eventType: 'weather' since Weather is not an event type
              details: event.details || {},
              location: newLocation
            }
          });
        } catch (error) {
          console.error('Error adding weather event:', error);
        }
      });
    }

    showNotification('Weather location updated successfully!', 'success');
  } catch (error) {
    console.error('Error updating weather location:', error);
    showNotification('Failed to update weather location', 'error');
  } finally {
    updateBtn.disabled = false;
    updateBtn.textContent = 'Update';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const locationInput = document.getElementById('weather-location-input');
  const updateBtn = document.getElementById('update-weather-btn');
  if (!locationInput || !updateBtn) return;

  const savedLocation = localStorage.getItem('weatherLocation');
  if (savedLocation) locationInput.value = savedLocation;

  updateBtn.addEventListener('click', () => updateWeatherLocation(locationInput, updateBtn));
  locationInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') updateWeatherLocation(locationInput, updateBtn);
  });
});


