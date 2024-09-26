type Id = string | number

export const Routes = {
	Home: "/",
	SignIn: "/sign-in",
	Discover: "/discover",
	Club: (clubId: Id) => `/clubs/${clubId}`,
	ClubSettings: (
		clubId: Id,
		slug: "members" | "general" | "schedule" | "questions",
	) => `/clubs/${clubId}/settings/${slug}`,
	ClubOnboardingScheduling: (clubId: Id) =>
		`/clubs/${clubId}/onboarding/schedule`,
	ClubOnboardingQuestions: (clubId: Id) =>
		`/clubs/${clubId}/onboarding/questions`,
	NewClub: "/clubs/new",
}
