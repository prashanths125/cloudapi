const {
  EC2Client,
  RunInstancesCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand
} = require("@aws-sdk/client-ec2");

const region = process.env.AWS_REGION || "ap-south-1";
const ec2 = new EC2Client({ region });

async function getDefaultVpcId() {
  const result = await ec2.send(
    new DescribeVpcsCommand({
      Filters: [{ Name: "isDefault", Values: ["true"] }]
    })
  );

  if (!result.Vpcs || result.Vpcs.length === 0) {
    throw new Error("No default VPC found in this region.");
  }

  return result.Vpcs[0].VpcId;
}

async function getDefaultSubnetId(vpcId) {
  const result = await ec2.send(
    new DescribeSubnetsCommand({
      Filters: [{ Name: "vpc-id", Values: [vpcId] }]
    })
  );

  if (!result.Subnets || result.Subnets.length === 0) {
    throw new Error("No subnet found in the default VPC.");
  }

  return result.Subnets[0].SubnetId;
}

async function getDefaultSecurityGroupId(vpcId) {
  const result = await ec2.send(
    new DescribeSecurityGroupsCommand({
      Filters: [
        { Name: "group-name", Values: ["default"] },
        { Name: "vpc-id", Values: [vpcId] }
      ]
    })
  );

  if (!result.SecurityGroups || result.SecurityGroups.length === 0) {
    throw new Error("No default security group found in default VPC.");
  }

  return result.SecurityGroups[0].GroupId;
}

async function provisionEC2() {
  const ami = process.env.AWS_AMI_ID;
  const keyName = process.env.AWS_KEY_NAME || null;

  const instanceType = process.env.AWS_INSTANCE_TYPE || "t3.micro";
  const instanceName = process.env.AWS_INSTANCE_NAME || "EC2-demo";

  if (!ami) throw new Error("AWS_AMI_ID is missing");

  let subnetId = process.env.AWS_SUBNET_ID;
  let securityGroupId = process.env.AWS_SECURITY_GROUP_ID;

  if (!subnetId || !securityGroupId) {
    console.log("⚡ No subnet/security group provided. Picking default VPC resources...");

    const defaultVpcId = await getDefaultVpcId();

    if (!subnetId) subnetId = await getDefaultSubnetId(defaultVpcId);
    if (!securityGroupId) securityGroupId = await getDefaultSecurityGroupId(defaultVpcId);

    console.log("✅ Default VPC subnet selected:", subnetId);
    console.log("✅ Default security group selected:", securityGroupId);
  }

  const params = {
    ImageId: ami,
    InstanceType: instanceType,
    MaxCount: 1,
    MinCount: 1,

    NetworkInterfaces: [
      {
        DeviceIndex: 0,
        SubnetId: subnetId,
        Groups: [securityGroupId],
        AssociatePublicIpAddress: true
      }
    ],

    TagSpecifications: [
      {
        ResourceType: "instance",
        Tags: [
          { Key: "Name", Value: instanceName },
          { Key: "Project", Value: "Cloud API" },
          { Key: "Environment", Value: "dev" }
        ]
      }
    ]
  };

  if (keyName) {
    params.KeyName = keyName;
    console.log("🔑 Using KeyPair:", keyName);
  } else {
    console.log("⚠️ No KeyPair provided. Instance will NOT be SSH accessible.");
  }

  const result = await ec2.send(new RunInstancesCommand(params));
  return result.Instances[0];
}

module.exports = { provisionEC2 };
