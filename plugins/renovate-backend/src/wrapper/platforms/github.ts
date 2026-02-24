import {
  DefaultGithubCredentialsProvider,
  ScmIntegrations,
} from '@backstage/integration';

export async function getGithubToken(
  integrations: ScmIntegrations,
  url: string,
): Promise<string | undefined> {
  try {
    const cred = await DefaultGithubCredentialsProvider.fromIntegrations(
      integrations,
    ).getCredentials({ url });
    return cred.token;
  } catch (e) {
    return undefined;
  }
}
