
import { Appointment } from '../types.ts';

export const MessagingService = {
  /**
   * Generates a professional WhatsApp link with a "Medical Receipt" format.
   */
  getWhatsAppConfirmationLink: (appointment: Appointment) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const cancelUrl = `${baseUrl}#/cancel/${appointment.cancelToken}`;
    
    // Formal Kurdish Medical Receipt (Recipe)
    const message = 
      `🏥 **وەسلا ژڤانێ نۆژداری (Medical Receipt)**\n` +
      `----------------------------------\n` +
      `👤 **نەخۆش:** ${appointment.patientName}\n` +
      `👨‍⚕️ **نۆژدار:** Dr. ${appointment.doctorName}\n` +
      `🏢 **کلینیک:** ${appointment.clinicName}\n` +
      `📅 **ڕێکەفت:** ${appointment.appointmentDate}\n` +
      `⏰ **دەمژمێر:** ${appointment.appointmentTime}\n` +
      `----------------------------------\n` +
      `بۆ هەلوەشاندنا ژڤانێ خۆ، کلیک ل ڤێرە بکە:\n` +
      `${cancelUrl}\n\n` +
      `هیڤیا سلامەتیێ بۆ هەوە دخوازین.`;
    
    let phone = appointment.patientPhone.replace(/\s/g, '').replace(/-/g, '');
    
    // Automatically fix number for Kurdistan/Iraq (964)
    if (!phone.startsWith('964') && !phone.startsWith('00964')) {
      if (phone.startsWith('0')) {
        phone = '964' + phone.substring(1);
      } else {
        phone = '964' + phone;
      }
    }

    // Direct API link for automatic opening
    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
  }
};
