import {
	Body,
	Button,
	Container,
	Head,
	Hr,
	Html,
	Img,
	Preview,
	Section,
	Text,
} from "@react-email/components"

const baseUrl = process.env.VERCEL_URL ?? ""

export const StripeWelcomeEmail = ({
	inviter,
	recordClubName,
	recordClubId,
	clubInvitePublicId,
}: {
	inviter: string
	recordClubName: string
	recordClubId: number
	clubInvitePublicId: string
}) => (
	<Html>
		<Head />
		<Preview>
			{inviter} has invited you to {recordClubName} on record-clubs.com!
		</Preview>
		<Body style={main}>
			<Container style={container}>
				<Section style={box}>
					<Img
						src={`${baseUrl}/favicon.ico`}
						width="32"
						height="32"
						alt="Record Clubs"
					/>
					<Hr style={hr} />
					<Text style={paragraph}>
						{inviter} has invited you to {recordClubName} on record-clubs.com!
					</Text>
					<Button
						style={button}
						href={`${baseUrl}/clubs/${recordClubId}/join/${clubInvitePublicId}`}
					>
						Join club
					</Button>
				</Section>
			</Container>
		</Body>
	</Html>
)

export default StripeWelcomeEmail

const main = {
	backgroundColor: "#f6f9fc",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
	backgroundColor: "#ffffff",
	margin: "0 auto",
	padding: "20px 0 48px",
	marginBottom: "64px",
}

const box = {
	padding: "0 48px",
}

const hr = {
	borderColor: "#e6ebf1",
	margin: "20px 0",
}

const paragraph = {
	color: "#525f7f",

	fontSize: "16px",
	lineHeight: "24px",
	textAlign: "center" as const,
}

const button = {
	backgroundColor: "#656ee8",
	borderRadius: "5px",
	color: "#fff",
	fontSize: "16px",
	fontWeight: "bold",
	textDecoration: "none",
	textAlign: "center" as const,
	display: "block",
	width: "100%",
	padding: "10px",
}
