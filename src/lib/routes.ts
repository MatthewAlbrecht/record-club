type Id = string | number;

export const Routes = {
  Home: "/",
  SignIn: "/sign-in",
  Discover: "/discover",
  Club: (clubId: Id) => `/clubs/${clubId}`,
  ClubSettings: (clubId: Id) => `/clubs/${clubId}/settings`,
  ClubOnboardingScheduling: (clubId: Id) =>
    `/clubs/${clubId}/onboarding/schedule`,
  ClubOnboardingQuestions: (clubId: Id) =>
    `/clubs/${clubId}/onboarding/questions`,
  NewClub: "/clubs/new",
};
