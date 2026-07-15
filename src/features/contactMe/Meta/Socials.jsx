import styled from "styled-components";
import * as links from "../../../constants/constants";
import PrideText from "../../../themes/PrideText";
import NeuIconButton from "../../shared/neumorphic/NeuIconButton";
import CashAppIcon from "../../shared/OutletRenderer/icons/brands/CashAppIcon";
import GithubIcon from "../../shared/OutletRenderer/icons/brands/GithubIcon";
import InstagramIcon from "../../shared/OutletRenderer/icons/brands/InstagramIcon";
import PatreonIcon from "../../shared/OutletRenderer/icons/brands/PatreonIcon";
import RedditIcon from "../../shared/OutletRenderer/icons/brands/RedditIcon";
import TwitterIcon from "../../shared/OutletRenderer/icons/brands/TwitterIcon";
import { useTranslation } from "react-i18next";

const SocialsContainer = styled.div`
  text-align: center;
`;

const SocialsHeader = styled.div`
  text-align: center;
  margin-bottom: 16px;

  h2 {
    margin-bottom: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }
`;

const SocialsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
`;

const SocialLink = styled(NeuIconButton)`
  text-decoration: none;
`;

export default function Socials() {
  const { t } = useTranslation();

  const socials = [
    { href: links.githubLink, label: t("social.github"), Icon: GithubIcon },
    { href: links.redditLink, label: t("social.reddit"), Icon: RedditIcon },
    { href: links.twitterLink, label: t("social.x"), Icon: TwitterIcon },
    {
      href: links.instagramLink,
      label: t("social.instagram"),
      Icon: InstagramIcon,
    },
    { href: links.cashAppLink, label: t("social.cashApp"), Icon: CashAppIcon },
    { href: links.patreonLink, label: t("social.patreon"), Icon: PatreonIcon },
  ];

  return (
    <SocialsContainer>
      <SocialsHeader>
        <h2>
          <PrideText text={t("social.connectWithMe")} />
        </h2>
      </SocialsHeader>
      <SocialsList>
        {socials.map(({ href, label, Icon }) => (
          <SocialLink
            key={href}
            as="a"
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={label}
            title={label}
          >
            <Icon />
          </SocialLink>
        ))}
      </SocialsList>
    </SocialsContainer>
  );
}
