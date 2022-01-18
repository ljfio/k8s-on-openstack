#!/bin/sh

# let iptables see bridged traffic
cat <<EOF | tee /etc/modules-load.d/containerd.conf
overlay
br_netfilter
EOF

cat <<EOF | tee /etc/sysctl.d/99-kubernetes-cri.conf
net.ipv4.ip_forward = 1
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
EOF

sysctl --system

# update apt
apt-get update

# install containerd
apt-get install -y containerd

# create containerd config directory
mkdir -p /etc/containerd/

# copy default config
containerd config default | tee /etc/containerd/config.toml

# downlaod dasel
curl -L -o /usr/local/bin/dasel https://github.com/TomWright/dasel/releases/download/v1.22.1/dasel_linux_amd64

# change permissions
chmod +x /usr/local/bin/dasel

# set the
dasel put bool -f /etc/containerd/config.toml '.plugins.io\.containerd\.grpc\.v1\.cri.containerd.runtimes.runc.options.SystemdCgroup' true

# install curl
apt-get install -y apt-transport-https ca-certificates curl

# load in Google apt key
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -

# add in source to apt
cat <<EOF | tee /etc/apt/sources.list.d/kubernetes.list
deb https://apt.kubernetes.io/ kubernetes-xenial main
EOF

# update apt sources
apt-get update

# install k8s
apt install -y kubelet kubeadm kubectl

# mark k8s to not auto update
apt-mark hold kubelet kubeadm kubectl

# enable service
systemctl enable kubelet.service
systemctl enable containerd.service