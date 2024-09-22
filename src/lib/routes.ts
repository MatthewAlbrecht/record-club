type Id = string | number;

export const Routes = {
  ClubOnboardingScheduling: (clubId: Id) =>
    `/clubs/${clubId}/onboarding/schedule`,
  ClubOnboardingQuestions: (clubId: Id) =>
    `/clubs/${clubId}/onboarding/questions`,
  NewClub: "/clubs/new",
};
