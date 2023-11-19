# Common

## Description

The common feature contains common utilities used by other features. These include:

- Converting between userId and scholarId
- Managing feature flags
- Formatting timestamps and durations.

## UserId vs ScholarId

For many features, we need to connect user data between slack and notion. On each end we have separate ids that we need to pair up, in order to correctly assign data from a slack user to the appropriate data of that user in notion, and vice versa.

- For **Slack**, we use the userId as the unique identifier for a user (referred to as `userId`).
- For **Notion**, we use the id of a row in the Scholars database as the unique identifier for a user (referred to as `scholarId`).
  - _We don't work with the actual notion account of a user, because not every user is expected to have joined the notion workspace._

## Feature Flags

Each feature can define one or multiple **feature flags**. Feature flags can be used to manage which users have access to a specific feature, control the rollout of changes or A/B test new features.

To create a feature flag, see the documentation in `./feature_flags.ts`, specifically on `class FeatureFlags`.

To set a feature flag, check the `⛳️ Feature Flags` database in notion.

## Sync Command

The `/sync` command is a special command only available to admin users. It is there to trigger certain actions that update the apps state.

This is mainly needed because the notion api does not support notifying an application if some data in notion changes. Therefore the app has to query for changes itself on a per request or timely basis.

Because we want to reduce the computation load and cache certain data, we do this very infrequently. Therefore by using the `/sync` command an admin can force an update of this data.
