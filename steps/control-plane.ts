import * as pulumi from "@pulumi/pulumi";
import * as os from "@pulumi/openstack";
import * as command from "@pulumi/command";

import * as path from "path";

import { installKubernetes } from "./install-k8s";

export interface SetupControlPlaneArgs {
    name: string;
    region: pulumi.Input<string>;
    user: pulumi.Input<string>;
    keyPair: pulumi.Input<string>;
    privateKey: pulumi.Input<string>;
};

export interface SetupControlPlaneResult {
    instance: os.compute.Instance;
    joinCommand: pulumi.Output<string>;
}

export function setupControlPlane(provider: os.Provider, args: SetupControlPlaneArgs): SetupControlPlaneResult {
    const instance = new os.compute.Instance(args.name, {
        region: args.region,
        flavorName: "d2-4",
        imageName: "Ubuntu 20.04",
        keyPair: args.keyPair,
    }, { provider });

    const connection: command.types.input.remote.ConnectionArgs = {
        host: instance.accessIpV4,
        user: args.user,
        privateKey: args.privateKey,
    };

    var installKubernetesCommand = installKubernetes(instance, {
        name: args.name,
        connection,
    });

    const copySetupFile = new command.remote.CopyFile(`copy-setup-script-${args.name}`, {
        localPath: path.normalize(path.join(__dirname, '../ubuntu/scripts/setup-control-plane.sh')),
        remotePath: '/tmp/setup.sh',
        connection
    }, {
        dependsOn: installKubernetesCommand,
        parent: instance,
    })

    const runSetupCommand = new command.remote.Command(`run-setup-script-${args.name}`, {
        create: "sh /tmp/setup.sh",
        connection,
    }, {
        dependsOn: copySetupFile,
        parent: instance,
    });

    const runCreateTokenCommand = new command.remote.Command(`run-create-token-${args.name}`, {
        create: "kubeadm token create --print-join-command",
        connection,
    }, {
        dependsOn: runSetupCommand,
        parent: instance,
    });

    return {
        instance,
        joinCommand: runCreateTokenCommand.stdout,
    };
}