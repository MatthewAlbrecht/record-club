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
	PostSignIn: "/post-sign-in",
	ClubJoin: (clubId: Id, inviteId: Id) => `/clubs/${clubId}/join/${inviteId}`,
	ClubOpenInvite: ({
		clubId,
		openInviteId,
	}: { clubId: Id; openInviteId: Id }) =>
		`/clubs/${clubId}/invite/${openInviteId}`,
}
