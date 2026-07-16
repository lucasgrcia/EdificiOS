import { CreateUserRequestDto } from '../../../authentication/infrastructure/http/create-user.dto';
import { LoginRequestDto } from '../../../authentication/infrastructure/http/login.dto';
import { AssignIncidentRequestDto } from '../../../operations/infrastructure/http/assign-incident.dto';
import { CreateWorkOrderFromIncidentRequestDto } from '../../../operations/infrastructure/http/create-work-order-from-incident.dto';
import { CreateWorkOrderRequestDto } from '../../../operations/infrastructure/http/create-work-order.dto';
import { DetectIncidentRequestDto } from '../../../operations/infrastructure/http/detect-incident.dto';
import { ListIncidentsQueryDto } from '../../../operations/infrastructure/http/list-incidents-query.dto';
import { CreateNotificationRequestDto } from '../../../operations/infrastructure/http/notification.dto';
import { RegisterActorRequestDto } from '../../../operations/infrastructure/http/register-actor.dto';
import { RegisterAssetRequestDto } from '../../../operations/infrastructure/http/register-asset.dto';
import { RegisterSiteRequestDto } from '../../../operations/infrastructure/http/register-site.dto';
import { StartShiftRequestDto } from '../../../operations/infrastructure/http/start-shift.dto';
import { ProblemDetailsSchema } from './problem-details.schema';

export const SWAGGER_EXTRA_MODELS = [
  ProblemDetailsSchema,
  CreateUserRequestDto,
  DetectIncidentRequestDto,
  AssignIncidentRequestDto,
  RegisterAssetRequestDto,
  RegisterSiteRequestDto,
  RegisterActorRequestDto,
  StartShiftRequestDto,
  CreateWorkOrderRequestDto,
  CreateWorkOrderFromIncidentRequestDto,
  CreateNotificationRequestDto,
  ListIncidentsQueryDto,
] as const;

export {
  AssignIncidentRequestDto,
  CreateNotificationRequestDto,
  CreateUserRequestDto,
  CreateWorkOrderFromIncidentRequestDto,
  CreateWorkOrderRequestDto,
  DetectIncidentRequestDto,
  LoginRequestDto,
  RegisterActorRequestDto,
  RegisterAssetRequestDto,
  RegisterSiteRequestDto,
  StartShiftRequestDto,
};
