export class CreateNotificationRequestDto {
  recipientId!: string;
  type!: string;
  channel!: string;
  message!: string;
}
