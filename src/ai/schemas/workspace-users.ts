export type User = {
  id: string;
  name: string;
  email: string;
  designation?: string;
  manager?: string;
  department?: string;
  lineOfBusiness?: string;
  location?: string;
  city?: string;
  modifier?: {
    name: string;
    email: string;
  };
  reason?: string;
  modifiedAt?: string;
  /** IT access: Internet access requested */
  internetAccess?: boolean;
  /** Optional list of sites to unblock when internetAccess is true */
  requestedSitesToUnblock?: string;
  /** IT access: External email sending */
  externalEmailSending?: boolean;
  /** Requested email recipients when externalEmailSending is true */
  externalEmailRecipients?: string;
  /** IT access: Work email setup on mobile */
  workEmailMobile?: boolean;
  /** IT access: VPN access */
  vpnAccess?: boolean;
  /** internal or external when vpnAccess is true */
  vpnType?: 'internal' | 'external';
};

export type GetWorkspaceUsersOutput = {
  users: User[];
};
