import * as pulumi from "@pulumi/pulumi";
import * as os from "@pulumi/openstack";
import * as command from "@pulumi/command";

import { readKeyFile } from "./util";

import { setupControlPlane } from "./steps/control-plane";
import { setupNode } from "./steps/node";

let config = new pulumi.Config();

let cloud = config.require("cloud");
let region = config.require("region");

let user = config.get("user") || "ubuntu";

let publicKeyPath = config.get("publicKeyPath") || "~/.ssh/id_rsa.pub";
let privateKeyPath = config.get("privateKeyPath") || "~/.ssh/id_rsa";

let publicKey = readKeyFile(publicKeyPath);
let privateKey = readKeyFile(privateKeyPath);

const provider = new os.Provider("openstack", {
    cloud: cloud,
    region: region,
});

const keyPair = new os.compute.Keypair("key-pair", {
    name: "kube-key-pair",
    region: region,
    publicKey: publicKey,
}, { provider });

const controlPlane = setupControlPlane(provider, {
    name: "kube-cp-1",
    region: region,
    user: user,
    keyPair: keyPair.name,
    privateKey: privateKey,
});

const node1Instance = setupNode(provider, {
    name: "kube-node-1",
    region: region,
    user: user,
    keyPair: keyPair.name,
    privateKey: privateKey,
    controlPlane: controlPlane.instance,
    joinCommand: controlPlane.joinCommand,
});

const node2Instance = setupNode(provider, {
    name: "kube-node-2",
    region: region,
    user: user,
    keyPair: keyPair.name,
    privateKey: privateKey,
    controlPlane: controlPlane.instance,
    joinCommand: controlPlane.joinCommand,
});

exports.controlPlane = {
    ipAddress: controlPlane.instance.accessIpV4,
};

exports.nodes = [
    {
        name: node1Instance.name,
        ipAddress: node1Instance.accessIpV4,
    },
    {
        name: node2Instance.name,
        ipAddress: node2Instance.accessIpV4,
    }
];