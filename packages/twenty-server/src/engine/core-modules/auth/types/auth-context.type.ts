import { type ApiKeyEntity } from 'src/engine/core-modules/api-key/api-key.entity';
import { type ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { type AuthContextUser } from 'src/engine/core-modules/auth/types/auth-context-user.type';
import { type CompanyRole } from 'src/engine/core-modules/company-membership/enums/company-role.enum';
import { type UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { type AuthProviderEnum } from 'src/engine/core-modules/workspace/types/workspace.type';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

export { AUTH_CONTEXT_USER_SELECT_FIELDS } from 'src/engine/core-modules/auth/constants/auth-context-user-select-fields.constants';
export { type AuthContextUser } from 'src/engine/core-modules/auth/types/auth-context-user.type';

export type RawAuthContext = {
  user?: AuthContextUser | null | undefined;
  apiKey?: ApiKeyEntity | null | undefined;
  workspaceMemberId?: string;
  workspaceMember?: WorkspaceMemberWorkspaceEntity;
  workspace?: WorkspaceEntity;
  application?: ApplicationEntity | null | undefined;
  userWorkspaceId?: string;
  userWorkspace?: UserWorkspaceEntity;
  authProvider?: AuthProviderEnum;
  impersonationContext?: {
    impersonatorUserWorkspaceId?: string;
    impersonatedUserWorkspaceId?: string;
  };
  companyId?: string;
  companyRole?: CompanyRole;
  isRootAdmin?: boolean;
};

// @deprecated Use WorkspaceAuthContext instead
export type AuthContext = RawAuthContext;

export type SerializableAuthContext = {
  userId?: string;
  userWorkspaceId?: string;
  workspaceMemberId?: string;
  apiKeyId?: string;
  applicationId?: string;
};

export enum JwtTokenTypeEnum {
  ACCESS = 'ACCESS',
  REFRESH = 'REFRESH',
  WORKSPACE_AGNOSTIC = 'WORKSPACE_AGNOSTIC',
  LOGIN = 'LOGIN',
  FILE = 'FILE',
  API_KEY = 'API_KEY',
  POSTGRES_PROXY = 'POSTGRES_PROXY',
  REMOTE_SERVER = 'REMOTE_SERVER',
  KEY_ENCRYPTION_KEY = 'KEY_ENCRYPTION_KEY',
  APPLICATION_ACCESS = 'APPLICATION_ACCESS',
  APPLICATION_REFRESH = 'APPLICATION_REFRESH',
  BOOTSTRAP = 'BOOTSTRAP',
}

type CommonPropertiesJwtPayload = {
  sub: string;
};

export type FileTokenJwtPayloadLegacy = CommonPropertiesJwtPayload & {
  type: JwtTokenTypeEnum.FILE;
  workspaceId: string;
  filename: string;
  workspaceMemberId?: string;
  noteBlockId?: string;
  attachmentId?: string;
  personId?: string;
};

export type FileTokenJwtPayload = CommonPropertiesJwtPayload & {
  type: JwtTokenTypeEnum.FILE;
  workspaceId: string;
  fileId: string;
};

export type LoginTokenJwtPayload = CommonPropertiesJwtPayload & {
  type: JwtTokenTypeEnum.LOGIN;
  workspaceId: string;
  authProvider: AuthProviderEnum;
  impersonatorUserWorkspaceId?: string;
};

export type TransientTokenJwtPayload = CommonPropertiesJwtPayload & {
  type: JwtTokenTypeEnum.LOGIN;
  workspaceId: string;
  userId: string;
  workspaceMemberId: string;
};

export type RefreshTokenJwtPayload = CommonPropertiesJwtPayload & {
  type: JwtTokenTypeEnum.REFRESH;
  workspaceId?: string | null;
  userId: string;
  jti?: string;
  authProvider?: AuthProviderEnum;
  targetedTokenType: JwtTokenTypeEnum;
  isImpersonating?: boolean;
  impersonatorUserWorkspaceId?: string;
  impersonatedUserWorkspaceId?: string;
};

export type WorkspaceAgnosticTokenJwtPayload = CommonPropertiesJwtPayload & {
  type: JwtTokenTypeEnum.WORKSPACE_AGNOSTIC;
  userId: string;
  authProvider: AuthProviderEnum;
};

export type ApiKeyTokenJwtPayload = CommonPropertiesJwtPayload & {
  type: JwtTokenTypeEnum.API_KEY;
  workspaceId: string;
  workspaceMemberId?: string;
  jti?: string;
};

export type ApplicationAccessTokenJwtPayload = CommonPropertiesJwtPayload & {
  type: JwtTokenTypeEnum.APPLICATION_ACCESS;
  workspaceId: string;
  applicationId: string;
  userWorkspaceId?: string;
  userId?: string;
};

export type ApplicationRefreshTokenJwtPayload = CommonPropertiesJwtPayload & {
  type: JwtTokenTypeEnum.APPLICATION_REFRESH;
  workspaceId: string;
  applicationId: string;
  userWorkspaceId?: string;
  userId?: string;
};

export type AccessTokenJwtPayload = CommonPropertiesJwtPayload & {
  type: JwtTokenTypeEnum.ACCESS;
  workspaceId: string;
  userId: string;
  workspaceMemberId?: string;
  userWorkspaceId: string;
  authProvider: AuthProviderEnum;
  isImpersonating?: boolean;
  impersonatorUserWorkspaceId?: string;
  impersonatedUserWorkspaceId?: string;
  companyId?: string;
  companyRole?: CompanyRole;
  isRootAdmin?: boolean;
};

export type BootstrapTokenJwtPayload = CommonPropertiesJwtPayload & {
  type: JwtTokenTypeEnum.BOOTSTRAP;
  workspaceId: string;
  companyId: string;
  userId: string;
  /**
   * Snapshot of membership role at issuance time.
   * Consumers must re-read active membership before minting long-lived tokens.
   */
  companyRole: CompanyRole;
  /**
   * Derived from the membership role at issuance time.
   * Never trust this flag without re-validating current membership state.
   */
  isRootAdmin: boolean;
  /** Source system that requested bootstrap issuance for audit and diagnostics. */
  source: string;
  /** Unique token identifier used for replay protection. */
  jti: string;
};

export type PostgresProxyTokenJwtPayload = CommonPropertiesJwtPayload & {
  type: JwtTokenTypeEnum.POSTGRES_PROXY;
};

export type JwtPayload =
  | AccessTokenJwtPayload
  | ApiKeyTokenJwtPayload
  | ApplicationAccessTokenJwtPayload
  | ApplicationRefreshTokenJwtPayload
  | WorkspaceAgnosticTokenJwtPayload
  | LoginTokenJwtPayload
  | TransientTokenJwtPayload
  | RefreshTokenJwtPayload
  | FileTokenJwtPayload
  | FileTokenJwtPayloadLegacy
  | PostgresProxyTokenJwtPayload
  | BootstrapTokenJwtPayload;
