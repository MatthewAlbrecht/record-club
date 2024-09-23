type Id = string | number;

export const Routes = {
  Home: "/",
  Discover: "/discover",
  ClubSettings: (clubId: Id) => `/clubs/${clubId}/settings`,
  ClubOnboardingScheduling: (clubId: Id) =>
    `/clubs/${clubId}/onboarding/schedule`,
  ClubOnboardingQuestions: (clubId: Id) =>
    `/clubs/${clubId}/onboarding/questions`,
  NewClub: "/clubs/new",
};
