const mongoose =
  require("mongoose");
require("dotenv").config();
const Organization =
  require("../src/models/Organization");

const OrganizationMember =
  require("../src/models/OrganizationMember");

const Workspace =
  require("../src/models/Workspace");

const WorkspaceMember =
  require("../src/models/WorkspaceMember");


// =====================================================
// CONFIG
// =====================================================

const MONGO_URI =
  process.env.MONGO_URI;


// =====================================================
// MAIN
// =====================================================

const migrate =
  async () => {

    if (!MONGO_URI) {

      throw new Error(
        "MONGO_URI is not configured"
      );

    }


    await mongoose.connect(
      MONGO_URI
    );

    console.log(
      "Connected to MongoDB"
    );


    const workspaces =
      await Workspace.find({
        $or: [
          {
            organization: {
              $exists: false,
            },
          },
          {
            organization: null,
          },
        ],
      });


    console.log(
      `Found ${workspaces.length} legacy workspaces`
    );


    const organizationCache =
      new Map();


    for (
      const workspace
      of workspaces
    ) {

      if (!workspace.owner) {

        console.warn(
          `Skipping workspace ${workspace._id}: no owner`
        );

        continue;
      }


      const ownerId =
        workspace.owner.toString();


      let organization =
        organizationCache.get(
          ownerId
        );


      // ---------------------------------------------
      // FIND / CREATE DEFAULT ORGANIZATION
      // ---------------------------------------------

      if (!organization) {

        organization =
          await Organization.findOne({
            createdBy:
              workspace.owner,

            name:
              "My Organization",
          });


        if (!organization) {

          organization =
            await Organization.create({
              name:
                "My Organization",

              createdBy:
                workspace.owner,
            });

        }


        organizationCache.set(
          ownerId,
          organization
        );

      }


      // ---------------------------------------------
      // ORGANIZATION ADMIN
      // ---------------------------------------------

      await OrganizationMember.updateOne(

        {
          organization:
            organization._id,

          user:
            workspace.owner,
        },

        {
          $setOnInsert: {
            role:
              "organization_admin",

            status:
              "Active",

            joinedAt:
              new Date(),
          },
        },

        {
          upsert: true,
        }

      );


      // ---------------------------------------------
      // ASSIGN WORKSPACE
      // ---------------------------------------------

      workspace.organization =
        organization._id;


      await workspace.save();


      // ---------------------------------------------
      // MIGRATE WORKSPACE MEMBERS
      // ---------------------------------------------

      const members =
        await WorkspaceMember.find({
          workspace:
            workspace._id,

          status:
            "Active",
        });


      for (
        const member
        of members
      ) {

        const isOwner =
          member.user.toString() ===
          workspace.owner.toString();


        await OrganizationMember.updateOne(

          {
            organization:
              organization._id,

            user:
              member.user,
          },

          {
            $setOnInsert: {
              role:
                isOwner
                  ? "organization_admin"
                  : "member",

              status:
                "Active",

              joinedAt:
                new Date(),
            },
          },

          {
            upsert: true,
          }

        );

      }


      console.log(
        `Migrated workspace ${workspace.name}`
      );

    }


    console.log(
      "Migration completed successfully"
    );


    await mongoose.disconnect();

  };


// =====================================================
// RUN
// =====================================================

migrate()
  .catch(async (error) => {

    console.error(
      "Migration failed:",
      error
    );

    await mongoose.disconnect();

    process.exit(1);

  });