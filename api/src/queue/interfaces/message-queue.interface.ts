export const I_MESSAGE_QUEUE_SERVICE = 'IMessageQueueService';

export interface IMessageQueueService {
  addEmailJob(data: {
    companyId: string;
    companyName: string;
    cnpj: string;
    notificationId?: string;
  }): Promise<void>;
}
