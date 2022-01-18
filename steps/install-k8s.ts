import * as os from "@pulumi/openstack";
import * as command from "@pulumi/command";

export interface InstallKubernetesArgs {
    connection: command.types.input.remote.ConnectionArgs;
    name: string;
}

export function installKubernetes(instance: os.compute.Instance, args: InstallKubernetesArgs): command.remote.Command {
    const copyInstallFile = new command.remote.CopyFile(`copy-install-script-${args.name}`, {
        localPath: '../scripts/install.sh',
        remotePath: 'install.sh',
        connection: args.connection
    }, {
        dependsOn: [instance]
    });

    const runInstallCommand = new command.remote.Command(`run-install-script-${args.name}`, {
        create: "sudo sh install.sh",
        connection: args.connection
    }, {
        dependsOn: [copyInstallFile]
    });

    return runInstallCommand;
}