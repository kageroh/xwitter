<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:regexp="http://exslt.org/regular-expressions"
  xmlns="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="regexp">

  <xsl:output method="xml"
	encoding="utf-8"
	omit-xml-declaration="no"
	doctype-system=""
	indent="no"
	media-type="application/xhtml+xml" />

  <xsl:template match="statuses[status]">
	<body>
	  <xsl:apply-templates select="status" />
	</body>
  </xsl:template>

  <xsl:template match="status">
	<section title="{id}">
	  <xsl:if test="user/protected = 'true'">
		<xsl:attribute name="class">protected</xsl:attribute>
	  </xsl:if>
	  <img src="{regexp:replace(user/profile_image_url, '^(.+_)normal(\..+)$', '', '$1mini$2')}" alt="" />
	  <div class="meta">
		<header>
		  <h1><xsl:value-of select="user/screen_name" /></h1>
		</header>
		<footer>
		  <time><xsl:value-of select="created_at" /></time>
		  <xsl:text>via </xsl:text>
		  <em class="source">
			<xsl:value-of select="regexp:replace(source, '^&lt;a href=&quot;.+&quot; rel=&quot;nofollow&quot;&gt;(.+)&lt;/a&gt;$', '', '$1')" />
		  </em>
		</footer>
	  </div>
	  <p>
		<xsl:if test="favorited = 'true'">
		  <xsl:attribute name="class">favorited</xsl:attribute>
		</xsl:if>
		<xsl:value-of select="text" />
	  </p>
	</section>
  </xsl:template>

</xsl:stylesheet>
