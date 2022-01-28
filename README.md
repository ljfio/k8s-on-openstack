# Kubernetes on Openstack

Use this repository to setup a Kubernetes cluster on an Openstack cloud using the Pulumi infrastructue-as-code tool

# Setup

Install the node packages / dependencies using yarn

```bash
yarn install
```

Set each of the configuration values

```bash
pulumi config set cloud default
```

Below is a table of the configuration values for your stack

| Key            | Example           | Required | Default           |
| -------------- | ----------------- | -------- | ----------------- |
| cloud          | default           | Yes      |                   |
| region         | region1           | Yes      |                   |
| user           | admin             | No       | ubuntu            |
| publicKeyPath  | ~/.ssh/id_rsa.pub | No       | ~/.ssh/id_rsa.pub |
| privateKeyPath | ~/.ssh/id_rsa     | No       | ~/.ssh/id_rsa     |

# Launch

Run Pulumi using the `up` command to deploy the stack

```bash
pulumi up
```