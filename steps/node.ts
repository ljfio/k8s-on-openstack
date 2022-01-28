import * as pulumi from "@pulumi/pulumi"
import * as os from "@pulumi/openstack";
import * as command from "@pulumi/command";

import { installKubernetes } from "./install-k8s";

export interface SetupNodeArgs {
    name: string;
    region: pulumi.Input<string>;
    user: pulumi.Input<string>;
    keyPair: pulumi.Input<string>;
    privateKey: pulumi.Input<string>;
    controlPlane: os.compute.Instance;
    joinCommand: pulumi.Input<string>;
};

export function setupNode(provider: os.Provider, args: SetupNodeArgs): os.compute.Instance {
    const instance = new os.compute.Instance(args.name, {
        region: args.region,
        flavorName: "d2-8",
        imageName: "Ubuntu 20.04",
        keyPair: args.keyPair,
    }, {
        provider,
        dependsOn: args.controlPlane
    });

    const connection: command.types.input.remote.ConnectionArgs = {
        host: instance.accessIpV4,
        user: args.user,
        privateKey: args.privateKey,
    };

    const installKubernetesCommand = installKubernetes(instance, {
        name: args.name,
        connection,
    });

    const runJoinCommand = new command.remote.Command(`run-setup-${args.name}`, {
        create: args.joinCommand,
        connection,
    }, {
        dependsOn: installKubernetesCommand
    });

    return instance;
}