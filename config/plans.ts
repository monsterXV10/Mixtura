// Edit this file to change plan limits. Changes apply everywhere in the app.

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    limits: {
      recipes: 20,
      ingredients: 20,
    },
    features: {
      teamManagement: false,
      establishments: 0,
      adminUsers: 0,
      barmanUsers: 1,
      batchTool: true,
      exportPdf: false,
      ocrScanner: false,
      advancedAnalytics: false,
      offlineMode: true,
    },
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    price: null, // set when payments are activated
    limits: {
      recipes: 100,       // ← change this number to update the Plus plan limit
      ingredients: Infinity,
    },
    features: {
      teamManagement: false,
      establishments: 0,
      adminUsers: 1,      // themselves as admin
      barmanUsers: 0,
      batchTool: true,
      exportPdf: true,
      ocrScanner: false,
      advancedAnalytics: false,
      offlineMode: true,
    },
  },
  team: {
    id: 'team',
    name: 'Team',
    price: null,
    limits: {
      recipes: 500,       // ← change this number to update the Team plan limit
      ingredients: Infinity,
    },
    features: {
      teamManagement: true,
      establishments: 1,
      adminUsers: 2,      // ← change this to update max admins in Team plan
      barmanUsers: Infinity,
      batchTool: true,
      exportPdf: true,
      ocrScanner: true,
      advancedAnalytics: false,
      offlineMode: true,
    },
  },
  team_plus: {
    id: 'team_plus',
    name: 'Team+',
    price: null,
    limits: {
      recipes: Infinity,
      ingredients: Infinity,
    },
    features: {
      teamManagement: true,
      establishments: Infinity, // add-on based
      adminUsers: Infinity,     // add-on based
      barmanUsers: Infinity,
      batchTool: true,
      exportPdf: true,
      ocrScanner: true,
      advancedAnalytics: true,
      offlineMode: true,
    },
  },
} as const;

export type PlanId = keyof typeof PLANS;
export type Plan = (typeof PLANS)[PlanId];

export function getPlan(id: PlanId): Plan {
  return PLANS[id];
}

export function canAddRecipe(planId: PlanId, currentCount: number): boolean {
  const limit = PLANS[planId].limits.recipes;
  return limit === Infinity || currentCount < limit;
}

export function canAddIngredient(planId: PlanId, currentCount: number): boolean {
  const limit = PLANS[planId].limits.ingredients;
  return limit === Infinity || currentCount < limit;
}

export function hasFeature(planId: PlanId, feature: keyof Plan['features']): boolean {
  return PLANS[planId].features[feature] as boolean;
}

// Role-based permissions — what each role can do within a team
export const ROLE_PERMISSIONS = {
  owner: {
    canManageTeam: true,
    canInviteMembers: true,
    canRemoveMembers: true,
    canPromoteMembers: true,
    canShareRecipes: true,
    canShareIngredients: true,
    canShareMenus: true,
    canEditSharedItems: true,
    canDeleteSharedItems: true,
    canManageEstablishments: true,
    canViewAnalytics: true,
    canExportData: true,
    canUseBatch: true,
    canAddNotes: true,
  },
  admin: {
    canManageTeam: true,
    canInviteMembers: true,
    canRemoveMembers: false,
    canPromoteMembers: false,
    canShareRecipes: true,
    canShareIngredients: true,
    canShareMenus: true,
    canEditSharedItems: true,
    canDeleteSharedItems: false,
    canManageEstablishments: false,
    canViewAnalytics: true,
    canExportData: true,
    canUseBatch: true,
    canAddNotes: true,
  },
  barman: {
    canManageTeam: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canPromoteMembers: false,
    canShareRecipes: false,
    canShareIngredients: false,
    canShareMenus: false,
    canEditSharedItems: false,
    canDeleteSharedItems: false,
    canManageEstablishments: false,
    canViewAnalytics: false,
    canExportData: false,
    canUseBatch: true,
    canAddNotes: true,
  },
  viewer: {
    canManageTeam: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canPromoteMembers: false,
    canShareRecipes: false,
    canShareIngredients: false,
    canShareMenus: false,
    canEditSharedItems: false,
    canDeleteSharedItems: false,
    canManageEstablishments: false,
    canViewAnalytics: false,
    canExportData: false,
    canUseBatch: false,
    canAddNotes: false,
  },
} as const;

export type UserRole = keyof typeof ROLE_PERMISSIONS;
export type Permission = keyof typeof ROLE_PERMISSIONS.owner;

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

// Demo access codes — these simulate different plan/role combinations in the demo
export const DEMO_CODES = {
  OWNER: { plan: 'team_plus' as PlanId, role: 'owner', label: 'Propriétaire' },
  ADMIN: { plan: 'team' as PlanId, role: 'admin', label: 'Manager' },
  USER: { plan: 'free' as PlanId, role: 'barman', label: 'Barman' },
  PLUS: { plan: 'plus' as PlanId, role: 'admin', label: 'Solo Plus' },
  '': { plan: 'free' as PlanId, role: 'viewer', label: 'Visiteur' },
} as const;

export type DemoCode = keyof typeof DEMO_CODES;
