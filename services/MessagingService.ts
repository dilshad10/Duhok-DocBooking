
import { Appointment } from '../types.ts';
import { StorageService } from './storage';
import { translations } from '../translations';

export const MessagingService = {
  /**
   * Generates a localized professional WhatsApp link.
   */
  getWhatsAppConfirmationLink: (appointment: Appointment) => {
    const lang = StorageService.getLanguage();
    const t = translations[lang];
    const baseUrl = window.location.origin + window.location.pathname;
    const cancelUrl = `${baseUrl}#/cancel/${appointment.cancelToken}`;
    
    // Localized Professional Header
    let message = "";
    
    if (lang === 'ku') {
      message = 
        `🏥 **${t.receiptTitle}**\n` +
        `----------------------------------\n` +
        `👤 **${t.patient}:** ${appointment.patientName}\n` +
        `👨‍⚕️ **${t.doctor}:** Dr. ${appointment.doctorName}\n` +
        `🏢 **کلینیک:** ${appointment.clinicName}\n` +
        `📅 **ڕێکەفت:** ${appointment.appointmentDate}\n` +
        `⏰ **دەمژمێر:** ${appointment.appointmentTime}\n` +
        `----------------------------------\n` +
        `بۆ هەلوەشاندنا ژڤانێ خۆ، کلیک ل ڤێرە بکە:\n` +
        `${cancelUrl}\n\n` +
        `هیڤیا سلامەتیێ بۆ هەوە دخوازین.`;
    } else if (lang === 'ar') {
      message = 
        `🏥 **${t.receiptTitle}**\n` +
        `----------------------------------\n` +
        `👤 **${t.patient}:** ${appointment.patientName}\n` +
        `👨‍⚕️ **${t.doctor}:** د. ${appointment.doctorName}\n` +
        `🏢 **العيادة:** ${appointment.clinicName}\n` +
        `📅 **التاريخ:** ${appointment.appointmentDate}\n` +
        `⏰ **الوقت:** ${appointment.appointmentTime}\n` +
        `----------------------------------\n` +
        `لإلغاء الموعد، يرجى الضغط هنا:\n` +
        `${cancelUrl}\n\n` +
        `مع تمنياتنا لكم بالسلامة.`;
    } else {
      message = 
        `🏥 **${t.receiptTitle}**\n` +
        `----------------------------------\n` +
        `👤 **${t.patient}:** ${appointment.patientName}\n` +
        `👨‍⚕️ **${t.doctor}:** Dr. ${appointment.doctorName}\n` +
        `🏢 **Clinic:** ${appointment.clinicName}\n` +
        `📅 **Date:** ${appointment.appointmentDate}\n` +
        `⏰ **Time:** ${appointment.appointmentTime}\n` +
        `----------------------------------\n` +
        `To cancel your appointment, click here:\n` +
        `${cancelUrl}\n\n` +
        `Wishing you a speedy recovery.`;
    }
    
    let phone = appointment.patientPhone.replace(/\s/g, '').replace(/-/g, '');
    if (!phone.startsWith('964') && !phone.startsWith('00964')) {
      if (phone.startsWith('0')) {
        phone = '964' + phone.substring(1);
      } else {
        phone = '964' + phone;
      }
    }

    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
  }
};
