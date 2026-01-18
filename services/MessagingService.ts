
import { Appointment } from '../types';

export const MessagingService = {
  /**
   * Generates a professional WhatsApp link with the requested Kurdish text.
   */
  getWhatsAppConfirmationLink: (appointment: Appointment) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const cancelUrl = `${baseUrl}#/cancel/${appointment.cancelToken}`;
    
    const message = 
      `سلاڤ، ژڤانێ هەوە هاتە پشتڕاستکرن.\n\n` +
      `نۆژدار: Dr. ${appointment.doctorName}\n` +
      `کلینیک: ${appointment.clinicName}\n` +
      `ڕێکەفت: ${appointment.appointmentDate}\n` +
      `دەم: ${appointment.appointmentTime}\n\n` +
      `بۆ هەلوەشاندنا ژڤانێ خۆ، کلیک ل ڤێرە بکە:\n` +
      `${cancelUrl}`;
    
    let phone = appointment.patientPhone.replace(/\s/g, '').replace(/-/g, '');
    if (!phone.startsWith('964') && !phone.startsWith('00964')) {
      if (phone.startsWith('0')) phone = '964' + phone.substring(1);
      else phone = '964' + phone;
    }

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  },

  /**
   * Triggers the window open immediately.
   * NOTE: This should be called directly inside a click handler to avoid popup blockers.
   */
  triggerAutomaticRedirect: (appointment: Appointment) => {
    const link = MessagingService.getWhatsAppConfirmationLink(appointment);
    window.open(link, '_blank');
  }
};
