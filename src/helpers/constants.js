module.exports = {
  maps: {
    images: {
      map: {
        id: {
          item: "images.id",
          type: "number",
          table: false,
        },
        deleted_at: {
          item: "images.deleted_at",
          type: "number",
          table: false,
        },
        filename: {
          item: "images.filename",
          type: "string",
          table: false,
        },
        path: {
          item: "images.path",
          type: "string",
          table: false,
        },
        del_after: {
          item: "images.del_after",
          type: "number",
          table: false,
        },
        is_pb: {
          item: "images.is_pb",
          type: "number",
          table: false,
        },
        paths: {
          item: "images.paths",
          type: "json",
          table: false,
        },
        description: {
          item: "images.description",
          type: "string",
          table: false,
        },
        type: {
          item: "images.type",
          type: "number",
          table: false,
        },
        author_id: {
          item: "images.author_id",
          type: "number",
          table: false,
        },
        source_id: {
          item: "images.source_id",
          type: "number",
          table: false,
        },
        author_name: {
          item: "images_authors.name",
          type: "string",
          table: "images_authors",
        },
        source_name: {
          item: "images_sources.name",
          type: "string",
          table: "images_sources",
        },
        tags: {
          item: "images.tags",
          type: "json",
          table: false,
        },
        user_id: {
          item: "images.user_id",
          type: "number",
          table: false,
        },
        created_at: {
          item: "images.created_at",
          type: "number",
          table: false,
        },
        creator: {
          item: "users.fullname",
          type: "string",
          table: "users",
        },
        used: {
          item: "(SELECT JSON_ARRAYAGG(`user_str`) FROM used_images WHERE image_id = images.id)",
          type: "json",
          table: false,
        },
      },
      tables: {
        images_authors: {
          item: "left join images_authors on images_authors.id=images.author_id",
          link: false,
        },
        images_sources: {
          item: "left join images_sources on images_sources.id=images.source_id",
          link: false,
        },
        users: {
          item: "left join users on users.id=images.user_id",
          link: false,
        },
      },
    },
    tags: {
      map: {
        id: {
          item: "tags.id",
          type: "number",
          table: false,
        },
        name: {
          item: "tags.name",
          type: "string",
          table: false,
        },
        is_active: {
          item: "tags.is_active",
          type: "number",
          table: false,
        },
      },
      tables: {},
    },
    image_users_list: {
      map: {
        id: {
          item: "image_users_list.id",
          type: "number",
          table: false,
        },
        name: {
          item: "image_users_list.name",
          type: "string",
          table: false,
        },
      },
      tables: {},
    },
    images_authors: {
      map: {
        id: {
          item: "images_authors.id",
          type: "number",
          table: false,
        },
        name: {
          item: "images_authors.name",
          type: "string",
          table: false,
        },
      },
      tables: {},
    },
    images_sources: {
      map: {
        id: {
          item: "images_sources.id",
          type: "number",
          table: false,
        },
        name: {
          item: "images_sources.name",
          type: "string",
          table: false,
        },
      },
      tables: {},
    },
  },
};
